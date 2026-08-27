-- Inscricoes dos encontros Mulheres Curadas.
-- O banco guarda so texto curto: o QR code nao e armazenado, ele e desenhado
-- a partir do campo "codigo" na hora de montar o e-mail.
create table if not exists public.inscricoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  telefone text not null,
  email text not null,
  frequenta_igreja boolean not null default false,
  igreja text,
  consentimento boolean not null default true,
  origem text,
  email_enviado_em timestamptz,
  checkin_em timestamptz,
  criado_em timestamptz not null default now()
);

comment on table public.inscricoes is 'Inscricoes do site. O QR code nao e salvo: e gerado a partir de codigo.';
comment on column public.inscricoes.codigo is 'Codigo curto do ingresso, conteudo do QR code.';
comment on column public.inscricoes.checkin_em is 'Preenchido quando o QR code e lido na entrada.';

create unique index if not exists inscricoes_email_unico on public.inscricoes (lower(email));
create index if not exists inscricoes_criado_em on public.inscricoes (criado_em desc);

-- Sem politicas: nenhuma leitura ou escrita pelas chaves publicas.
-- So a Edge Function (service_role) grava aqui.
alter table public.inscricoes enable row level security;
