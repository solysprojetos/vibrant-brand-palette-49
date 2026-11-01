-- Painel administrativo (/admin) do Mulheres Curadas.
--
-- Migracao so ADITIVA: nao altera a tabela de inscricoes nem as funcoes que
-- ja existem. Cria as tabelas do conteudo editavel (eventos, galeria,
-- mensagens, textos do site, equipe, contatos), a lista de quem pode entrar
-- no painel e o bucket das imagens.
--
-- Regra geral de seguranca (RLS):
--   * visitante (chave publica) le SO o que estiver publicado;
--   * visitante pode ENVIAR mensagem de contato, mas nunca ler;
--   * escrever, apagar e ler rascunhos: so quem esta em mc_equipe_acesso.

create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Quem pode entrar no painel
-- ---------------------------------------------------------------------------
create table if not exists public.mc_equipe_acesso (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  -- admin: tudo, inclusive gerenciar usuarios. editor: todo o conteudo.
  papel text not null default 'editor' check (papel in ('admin', 'editor')),
  criado_em timestamptz not null default now()
);
comment on table public.mc_equipe_acesso is 'Usuarios com acesso ao painel /admin.';
alter table public.mc_equipe_acesso enable row level security;

-- Funcoes de permissao fora do schema public (nao viram RPC na API).
create or replace function privado.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.mc_equipe_acesso where user_id = (select auth.uid()))
$$;

create or replace function privado.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mc_equipe_acesso
    where user_id = (select auth.uid()) and papel = 'admin'
  )
$$;

revoke all on function privado.eh_equipe() from public;
revoke all on function privado.eh_admin() from public;
grant execute on function privado.eh_equipe() to anon, authenticated;
grant execute on function privado.eh_admin() to anon, authenticated;

drop policy if exists "equipe ve a propria linha e admin ve todas" on public.mc_equipe_acesso;
create policy "equipe ve a propria linha e admin ve todas"
  on public.mc_equipe_acesso for select to authenticated
  using (user_id = (select auth.uid()) or (select privado.eh_admin()));

drop policy if exists "membro atualiza o proprio nome" on public.mc_equipe_acesso;
create policy "membro atualiza o proprio nome"
  on public.mc_equipe_acesso for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Ninguem promove a si mesmo: o papel so muda pela funcao admin-usuarios
-- (service_role) ou pelo SQL Editor.
create or replace function privado.protege_papel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.papel is distinct from old.papel and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Somente uma administradora pode mudar o papel.';
  end if;
  return new;
end
$$;

drop trigger if exists mc_equipe_acesso_protege_papel on public.mc_equipe_acesso;
create trigger mc_equipe_acesso_protege_papel
  before update on public.mc_equipe_acesso
  for each row execute function privado.protege_papel();

-- Mantem atualizado_em em dia.
create or replace function privado.toca_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end
$$;

-- ---------------------------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------------------------
create table if not exists public.mc_eventos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text not null default '',
  descricao text not null default '',
  banner_url text,
  inicio timestamptz not null,
  fim timestamptz,
  local text not null default '',
  endereco text not null default '',
  mapa_url text not null default '',
  -- [{ "hora": "18h30", "titulo": "Louvor", "descricao": "" }]
  programacao jsonb not null default '[]'::jsonb,
  informacoes text not null default '',
  investimento text not null default '',
  link_inscricao text not null default '',
  whatsapp text not null default '',
  publicado boolean not null default false,
  -- Marca manual: o evento aparece em "Realizados" mesmo antes da data acabar.
  realizado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists mc_eventos_inicio on public.mc_eventos (inicio);
alter table public.mc_eventos enable row level security;
drop trigger if exists mc_eventos_atualizado on public.mc_eventos;
create trigger mc_eventos_atualizado before update on public.mc_eventos
  for each row execute function privado.toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- Galeria: albuns e fotos
-- ---------------------------------------------------------------------------
create table if not exists public.mc_albuns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  descricao text not null default '',
  data date not null default current_date,
  evento_id uuid references public.mc_eventos (id) on delete set null,
  capa_url text,
  publicado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists mc_albuns_data on public.mc_albuns (data desc);
create index if not exists mc_albuns_evento on public.mc_albuns (evento_id);
alter table public.mc_albuns enable row level security;
drop trigger if exists mc_albuns_atualizado on public.mc_albuns;
create trigger mc_albuns_atualizado before update on public.mc_albuns
  for each row execute function privado.toca_atualizado_em();

create table if not exists public.mc_fotos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.mc_albuns (id) on delete cascade,
  url text not null,
  -- Caminho dentro do bucket, para apagar o arquivo junto com a foto.
  caminho text not null,
  legenda text not null default '',
  largura integer,
  altura integer,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists mc_fotos_album_ordem on public.mc_fotos (album_id, ordem);
alter table public.mc_fotos enable row level security;

-- ---------------------------------------------------------------------------
-- Mensagens e testemunhos
-- ---------------------------------------------------------------------------
create table if not exists public.mc_publicacoes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  tipo text not null default 'testemunho'
    check (tipo in ('testemunho', 'historia', 'mensagem', 'reflexao', 'video')),
  titulo text not null,
  autora text not null default '',
  contexto text not null default '',
  resumo text not null default '',
  conteudo text not null default '',
  imagem_url text,
  video_url text not null default '',
  -- Destaque: aparece nos depoimentos da pagina inicial.
  destaque boolean not null default false,
  publicado boolean not null default false,
  publicado_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists mc_publicacoes_publicado_em on public.mc_publicacoes (publicado_em desc);
alter table public.mc_publicacoes enable row level security;
drop trigger if exists mc_publicacoes_atualizado on public.mc_publicacoes;
create trigger mc_publicacoes_atualizado before update on public.mc_publicacoes
  for each row execute function privado.toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- Textos do site (inicio, sobre, contato e redes)
-- ---------------------------------------------------------------------------
create table if not exists public.mc_conteudo (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.mc_conteudo enable row level security;
drop trigger if exists mc_conteudo_atualizado on public.mc_conteudo;
create trigger mc_conteudo_atualizado before update on public.mc_conteudo
  for each row execute function privado.toca_atualizado_em();

-- ---------------------------------------------------------------------------
-- Equipe exibida na pagina Sobre
-- ---------------------------------------------------------------------------
create table if not exists public.mc_equipe (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text not null default '',
  bio text not null default '',
  foto_url text,
  ordem integer not null default 0,
  publicado boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.mc_equipe enable row level security;

-- ---------------------------------------------------------------------------
-- Mensagens do formulario de contato
-- ---------------------------------------------------------------------------
create table if not exists public.mc_contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (email ~* '^[^\s@]+@[^\s@]+\.[a-z]{2,}$' and char_length(email) <= 160),
  telefone text not null default '' check (char_length(telefone) <= 30),
  assunto text not null default '' check (char_length(assunto) <= 160),
  mensagem text not null check (char_length(mensagem) between 5 and 4000),
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists mc_contatos_criado_em on public.mc_contatos (criado_em desc);
alter table public.mc_contatos enable row level security;

-- ---------------------------------------------------------------------------
-- Politicas
-- ---------------------------------------------------------------------------
-- Leitura publica so do que esta publicado; equipe le tudo.
drop policy if exists "publico le eventos publicados" on public.mc_eventos;
create policy "publico le eventos publicados" on public.mc_eventos for select
  to anon, authenticated using (publicado or (select privado.eh_equipe()));

drop policy if exists "publico le albuns publicados" on public.mc_albuns;
create policy "publico le albuns publicados" on public.mc_albuns for select
  to anon, authenticated using (publicado or (select privado.eh_equipe()));

drop policy if exists "publico le fotos de albuns publicados" on public.mc_fotos;
create policy "publico le fotos de albuns publicados" on public.mc_fotos for select
  to anon, authenticated using (
    (select privado.eh_equipe())
    or exists (select 1 from public.mc_albuns a where a.id = album_id and a.publicado)
  );

drop policy if exists "publico le publicacoes publicadas" on public.mc_publicacoes;
create policy "publico le publicacoes publicadas" on public.mc_publicacoes for select
  to anon, authenticated using (publicado or (select privado.eh_equipe()));

drop policy if exists "publico le conteudo" on public.mc_conteudo;
create policy "publico le conteudo" on public.mc_conteudo for select
  to anon, authenticated using (true);

drop policy if exists "publico le equipe publicada" on public.mc_equipe;
create policy "publico le equipe publicada" on public.mc_equipe for select
  to anon, authenticated using (publicado or (select privado.eh_equipe()));

-- Contato: qualquer visitante envia (lido sempre comeca falso); so a equipe le.
drop policy if exists "visitante envia contato" on public.mc_contatos;
create policy "visitante envia contato" on public.mc_contatos for insert
  to anon, authenticated with check (lido = false);

drop policy if exists "equipe le contatos" on public.mc_contatos;
create policy "equipe le contatos" on public.mc_contatos for select
  to authenticated using ((select privado.eh_equipe()));

-- Escrita da equipe em todas as tabelas de conteudo.
do $$
declare
  t text;
begin
  foreach t in array array['mc_eventos', 'mc_albuns', 'mc_fotos', 'mc_publicacoes', 'mc_conteudo', 'mc_equipe']
  loop
    execute format('drop policy if exists "equipe cria" on public.%I', t);
    execute format('create policy "equipe cria" on public.%I for insert to authenticated with check ((select privado.eh_equipe()))', t);
    execute format('drop policy if exists "equipe edita" on public.%I', t);
    execute format('create policy "equipe edita" on public.%I for update to authenticated using ((select privado.eh_equipe())) with check ((select privado.eh_equipe()))', t);
    execute format('drop policy if exists "equipe apaga" on public.%I', t);
    execute format('create policy "equipe apaga" on public.%I for delete to authenticated using ((select privado.eh_equipe()))', t);
  end loop;
end
$$;

drop policy if exists "equipe marca contato como lido" on public.mc_contatos;
create policy "equipe marca contato como lido" on public.mc_contatos for update
  to authenticated using ((select privado.eh_equipe())) with check ((select privado.eh_equipe()));

drop policy if exists "equipe apaga contato" on public.mc_contatos;
create policy "equipe apaga contato" on public.mc_contatos for delete
  to authenticated using ((select privado.eh_equipe()));

-- Inscricoes: a tabela continua fechada para o publico. So acrescenta leitura
-- para quem entrou no painel com login, para o numero aparecer no dashboard.
drop policy if exists "equipe le inscricoes" on public.inscricoes;
create policy "equipe le inscricoes" on public.inscricoes for select
  to authenticated using ((select privado.eh_equipe()));

-- ---------------------------------------------------------------------------
-- Imagens (fotos, banners, capas)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mc-imagens', 'mc-imagens', true, 26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Bucket publico: a leitura dos arquivos e pela URL publica, sem politica de
-- select (assim ninguem consegue LISTAR o bucket pela API).
drop policy if exists "equipe envia imagens" on storage.objects;
create policy "equipe envia imagens" on storage.objects for insert to authenticated
  with check (bucket_id = 'mc-imagens' and (select privado.eh_equipe()));

drop policy if exists "equipe troca imagens" on storage.objects;
create policy "equipe troca imagens" on storage.objects for update to authenticated
  using (bucket_id = 'mc-imagens' and (select privado.eh_equipe()));

drop policy if exists "equipe apaga imagens" on storage.objects;
create policy "equipe apaga imagens" on storage.objects for delete to authenticated
  using (bucket_id = 'mc-imagens' and (select privado.eh_equipe()));

-- ---------------------------------------------------------------------------
-- Conteudo inicial: os mesmos textos que o site ja mostra hoje, para o painel
-- abrir preenchido. Nao sobrescreve nada que ja tenha sido salvo.
-- ---------------------------------------------------------------------------
insert into public.mc_conteudo (chave, valor) values
(
  'sobre',
  jsonb_build_object(
    'titulo', 'Curadas para curar.',
    'introducao', 'Com uma identidade delicada, feminina e atemporal, o projeto celebra mulheres que encontraram cura, força e propósito em sua caminhada de fé.',
    'historia', 'É um convite para viver a transformação, florescer em Cristo e refletir Sua graça por onde passar, porque quem é curada, também cura.',
    'missao', '',
    'visao', '',
    'valores', '',
    'proposito', '',
    'idealizadora_nome', 'Karoline Rodrigues',
    'idealizadora_titulo', 'Idealizadora',
    'idealizadora_texto', '',
    'idealizadora_foto', ''
  )
),
(
  'contato',
  jsonb_build_object(
    'email', 'contato@mulherescuradas.com',
    'instagram', '',
    'whatsapp', '',
    'whatsapp_texto', '',
    'endereco', '',
    'mapa_url', ''
  )
)
on conflict (chave) do nothing;
