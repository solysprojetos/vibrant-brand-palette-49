-- Ganhadoras do sorteio, guardadas no banco.
--
-- Quem ja ganhou nao participa de novo: nem depois de recarregar a pagina,
-- nem se o sorteio for aberto em outro aparelho. A chave unica em
-- inscricao_id garante isso no proprio banco: a mesma pessoa nunca entra
-- duas vezes nesta tabela.
--
-- So acrescenta: nada do que ja existe muda.

create table if not exists public.mc_sorteio_ganhadoras (
  inscricao_id uuid primary key references public.inscricoes (id) on delete cascade,
  premio text,
  sorteado_em timestamptz not null default now(),
  sorteado_por text
);

comment on table public.mc_sorteio_ganhadoras is 'Quem ja ganhou no sorteio (uma vez por pessoa).';

alter table public.mc_sorteio_ganhadoras enable row level security;

drop policy if exists "equipe le ganhadoras" on public.mc_sorteio_ganhadoras;
create policy "equipe le ganhadoras" on public.mc_sorteio_ganhadoras for select
  to authenticated using ((select privado.eh_equipe()));

-- Registra as ganhadoras de uma rodada. Quem ja tinha ganhado e ignorado;
-- devolve so quem foi registrada agora.
create or replace function public.mc_sorteio_registrar(p_ids uuid[], p_premio text default null)
returns setof uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_quem text;
begin
  if not privado.eh_equipe() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

  select nullif(trim(a.nome), '') into v_quem
  from public.mc_equipe_acesso a where a.user_id = (select auth.uid());

  return query
    insert into public.mc_sorteio_ganhadoras as g (inscricao_id, premio, sorteado_por)
    select distinct i.id, left(nullif(trim(coalesce(p_premio, '')), ''), 120), v_quem
    from public.inscricoes i
    where i.id = any (coalesce(p_ids, '{}'))
    on conflict (inscricao_id) do nothing
    returning g.inscricao_id;
end
$$;

revoke all on function public.mc_sorteio_registrar(uuid[], text) from public, anon;
grant execute on function public.mc_sorteio_registrar(uuid[], text) to authenticated;
