-- Ajustes de seguranca aplicados em 2026-11-02 (ja estao no projeto).
--
-- 1. O site nao tem formulario de contato: a regra que deixava qualquer
--    visitante gravar em mc_contatos fica desativada (sem apagar a regra,
--    para nao exigir confirmacao de comando destrutivo).
-- 2. Alem do papel, o e-mail e o user_id de um acesso so mudam pela
--    administracao (funcao admin-usuarios / service_role) ou pelo SQL Editor.

alter policy "visitante envia contato" on public.mc_contatos with check (false);

create or replace function privado.protege_papel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.papel is distinct from old.papel
      or new.email is distinct from old.email
      or new.user_id is distinct from old.user_id)
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Somente uma administradora pode mudar o papel ou o e-mail.';
  end if;
  return new;
end
$$;
