-- Quando o e-mail de lembrete da vespera saiu. Nulo enquanto nao saiu.
-- Serve para o disparo poder ser repetido sem mandar duas vezes para ninguem.
alter table public.inscricoes
  add column if not exists lembrete_enviado_em timestamptz;

comment on column public.inscricoes.lembrete_enviado_em is 'Quando o e-mail de lembrete do encontro foi entregue.';
