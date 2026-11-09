-- Inscricao feita na porta, pela recepcao.
--
-- Rode DEPOIS de 20261101130000_recepcao_e_checkin.sql. So acrescenta:
--
-- * Quem chega sem inscricao pode ser inscrita ali mesmo, na tela de check-in,
--   com nome completo, telefone e (se frequentar) a igreja. Nao pedimos e-mail
--   na porta, entao a coluna email passa a aceitar vazio. O indice unico por
--   e-mail continua valendo para quem informa e-mail (varios nulos nao colidem).
-- * A inscricao da porta ja entra com a presenca confirmada e marca
--   origem = 'recepcao', para aparecer separada nas contas.
-- * Continua respeitando o limite de vagas (trigger inscricoes_limite).

alter table public.inscricoes alter column email drop not null;

create or replace function public.mc_checkin_inscrever(
  p_nome text,
  p_telefone text,
  p_igreja text default null
)
returns table (
  id uuid,
  nome text,
  igreja text,
  codigo text,
  checkin_em timestamptz,
  checkin_por text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nome text := upper(regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g'));
  v_telefone text := trim(coalesce(p_telefone, ''));
  v_igreja text := nullif(trim(coalesce(p_igreja, '')), '');
  v_quem text;
  v_codigo text;
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_tentativa integer := 0;
begin
  if not privado.pode_checkin() then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;

  if length(v_nome) < 3 or position(' ' in v_nome) = 0 then
    raise exception 'NOME_INVALIDO' using errcode = 'P0001';
  end if;
  if length(regexp_replace(v_telefone, '\D', '', 'g')) < 10 then
    raise exception 'TELEFONE_INVALIDO' using errcode = 'P0001';
  end if;

  select nullif(trim(a.nome), '') into v_quem
  from public.mc_equipe_acesso a where a.user_id = (select auth.uid());

  -- Mesmo formato do site: MC-XXXX-XXXX, sem 0/O e 1/I.
  loop
    v_tentativa := v_tentativa + 1;
    select 'MC-' || string_agg(substr(v_alfabeto, 1 + floor(random() * 32)::int, 1), '')
      into v_codigo
      from generate_series(1, 8) g;
    v_codigo := substr(v_codigo, 1, 7) || '-' || substr(v_codigo, 8);
    exit when not exists (select 1 from public.inscricoes i where i.codigo = v_codigo);
    if v_tentativa > 20 then
      raise exception 'Nao foi possivel gerar o codigo do ingresso.';
    end if;
  end loop;

  return query
    insert into public.inscricoes as i (
      codigo, nome, telefone, email, frequenta_igreja, igreja, consentimento,
      origem, checkin_em, checkin_por
    )
    values (
      v_codigo, v_nome, left(v_telefone, 30), null, v_igreja is not null, left(v_igreja, 120), true,
      'recepcao', now(), v_quem
    )
    returning i.id, i.nome, i.igreja, i.codigo, i.checkin_em, i.checkin_por;
end
$$;

revoke all on function public.mc_checkin_inscrever(text, text, text) from public, anon;
grant execute on function public.mc_checkin_inscrever(text, text, text) to authenticated;
