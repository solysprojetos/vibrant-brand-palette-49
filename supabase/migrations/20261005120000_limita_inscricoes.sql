-- Limite de inscricoes do encontro: 300 pessoas.
--
-- A trava fica no banco, e nao so na Edge Function: duas inscricoes chegando
-- no mesmo instante poderiam passar juntas por uma contagem feita antes do
-- insert. Aqui cada insert espera a vez (advisory lock da transacao), conta e
-- so entra se ainda houver vaga.
--
-- Para mudar o limite, troque o 300 abaixo numa nova migracao e atualize
-- LIMITE_INSCRICOES em src/config/conteudo.ts (usado so para exibir).
create or replace function public.limite_inscricoes()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 300
$$;

comment on function public.limite_inscricoes() is 'Quantidade maxima de inscricoes aceitas.';

create or replace function public.barra_inscricao_alem_do_limite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('inscricoes_limite'));
  if (select count(*) from public.inscricoes) >= public.limite_inscricoes() then
    raise exception 'LIMITE_DE_INSCRICOES' using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists inscricoes_limite on public.inscricoes;
create trigger inscricoes_limite
  before insert on public.inscricoes
  for each row execute function public.barra_inscricao_alem_do_limite();
