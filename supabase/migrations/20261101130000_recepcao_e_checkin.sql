-- Recepcao e check-in pelo painel /admin.
--
-- Rode DEPOIS de 20261101120000_painel_administrativo.sql. Tambem so
-- acrescenta: a tabela de inscricoes ganha uma coluna opcional (quem validou
-- a entrada) e nada do que ja existe muda de comportamento.
--
-- Papeis do painel:
--   admin     tudo, inclusive criar e remover acessos
--   editor    eventos, fotos e textos
--   recepcao  SO a tela de check-in: busca pelo nome ou le o QR code e
--             confirma a entrada. Nao enxerga e-mail nem telefone de ninguem.

-- ---------------------------------------------------------------------------
-- Novo papel
-- ---------------------------------------------------------------------------
alter table public.mc_equipe_acesso drop constraint if exists mc_equipe_acesso_papel_check;
alter table public.mc_equipe_acesso
  add constraint mc_equipe_acesso_papel_check check (papel in ('admin', 'editor', 'recepcao'));

-- eh_equipe (escrever conteudo) continua so para admin e editor.
create or replace function privado.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.mc_equipe_acesso
    where user_id = (select auth.uid()) and papel in ('admin', 'editor')
  )
$$;

-- Qualquer pessoa do painel (inclusive recepcao) pode fazer check-in.
create or replace function privado.pode_checkin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.mc_equipe_acesso where user_id = (select auth.uid()))
$$;
revoke all on function privado.pode_checkin() from public;
grant execute on function privado.pode_checkin() to authenticated;

-- ---------------------------------------------------------------------------
-- Quem validou cada entrada
-- ---------------------------------------------------------------------------
alter table public.inscricoes add column if not exists checkin_por text;
comment on column public.inscricoes.checkin_por is 'Nome de quem confirmou a entrada pelo painel /admin.';

-- ---------------------------------------------------------------------------
-- Funcoes do check-in (chamadas pelo painel como RPC)
--
-- A recepcao nao le a tabela direto: estas funcoes devolvem so o necessario
-- para conferir a entrada (nome, igreja, codigo e presenca), sem e-mail nem
-- telefone, e so atendem quem esta em mc_equipe_acesso.
-- ---------------------------------------------------------------------------
create or replace function public.mc_checkin_lista()
returns table (
  id uuid,
  nome text,
  igreja text,
  codigo text,
  checkin_em timestamptz,
  checkin_por text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.pode_checkin() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  return query
    select i.id, i.nome, i.igreja, i.codigo, i.checkin_em, i.checkin_por
    from public.inscricoes i
    order by i.nome;
end
$$;

-- Confirma (ou desfaz) a entrada. Devolve a linha e se ela ja estava marcada.
create or replace function public.mc_checkin_marcar(p_codigo text, p_desfazer boolean default false)
returns table (
  id uuid,
  nome text,
  codigo text,
  checkin_em timestamptz,
  checkin_por text,
  ja_estava boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alvo text := upper(trim(coalesce(p_codigo, '')));
  v_quem text;
  v_antes timestamptz;
  v_id uuid;
begin
  if not privado.pode_checkin() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

  select nullif(trim(a.nome), '') into v_quem
  from public.mc_equipe_acesso a where a.user_id = (select auth.uid());

  -- Trava a linha: duas recepcionistas lendo o mesmo QR ao mesmo tempo nao
  -- geram duas confirmacoes.
  select i.id, i.checkin_em into v_id, v_antes
  from public.inscricoes i where i.codigo = v_alvo
  for update;

  if v_id is null then
    return;
  end if;

  if p_desfazer then
    update public.inscricoes i set checkin_em = null, checkin_por = null where i.id = v_id;
  elsif v_antes is null then
    update public.inscricoes i set checkin_em = now(), checkin_por = v_quem where i.id = v_id;
  end if;

  return query
    select i.id, i.nome, i.codigo, i.checkin_em, i.checkin_por, (v_antes is not null)
    from public.inscricoes i where i.id = v_id;
end
$$;

revoke all on function public.mc_checkin_lista() from public, anon;
revoke all on function public.mc_checkin_marcar(text, boolean) from public, anon;
grant execute on function public.mc_checkin_lista() to authenticated;
grant execute on function public.mc_checkin_marcar(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Evento atual ja cadastrado no painel
-- ---------------------------------------------------------------------------
insert into public.mc_eventos (
  slug, titulo, resumo, descricao, banner_url, inicio, local, endereco,
  informacoes, link_inscricao, publicado
)
values (
  'encontro-9-de-novembro-2026',
  'Encontro Mulheres Curadas',
  'Encontro Mulheres Curadas, por Karoline Rodrigues, com Pr. Samuel Vagner e Gaby Cardozo.',
  'Mulheres Curadas por Karoline Rodrigues, com Pr. Samuel Vagner e Gaby Cardozo.',
  'https://www.mulherescuradas.com/imagens/banner-encontro-9-nov.jpg',
  '2026-11-09 18:30:00-03',
  'CC Visão Profética',
  'Av. dos Marinheiros, 319 - Cidade Nova, Maracanaú - CE',
  'Leve 2 kg de alimento.',
  'https://www.mulherescuradas.com/inscricao/',
  true
)
on conflict (slug) do nothing;
