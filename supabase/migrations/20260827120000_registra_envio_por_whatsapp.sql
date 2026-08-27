-- Quando o ingresso saiu pelo WhatsApp. Nulo enquanto nao saiu.
alter table public.inscricoes
  add column if not exists whatsapp_enviado_em timestamptz;

comment on column public.inscricoes.whatsapp_enviado_em is 'Quando o ingresso foi entregue pelo WhatsApp.';
