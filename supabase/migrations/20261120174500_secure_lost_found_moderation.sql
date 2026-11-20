-- Lost-and-found: allow only verified moderators to administer records;
-- every public submission always starts pending, and authors can only resolve their own approved cases.
drop policy if exists "Admins podem gerenciar achados e perdidos" on public.achados_perdidos;
create policy "Administradores com MFA podem moderar achados"
  on public.achados_perdidos as permissive for all to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

drop policy if exists "Inserir item de achados e perdidos com validacao" on public.achados_perdidos;
create policy "Inserir item de achados e perdidos com validacao"
  on public.achados_perdidos as permissive for insert to anon, authenticated
  with check (
    length(btrim(titulo::text)) between 3 and 160
    and length(btrim(descricao)) between 10 and 4000
    and length(btrim(local_fato::text)) between 2 and 200
    and length(btrim(contato_nome::text)) between 2 and 150
    and length(btrim(contato_telefone::text)) between 10 and 25
    and (usuario_id is null or usuario_id = (select auth.uid()))
    and (status = 'pendente' or private.admin_mfa_verified(null, false))
  );

-- The client has no blanket UPDATE privilege; allow only status changes to be attempted.
-- RLS and the trigger still decide whether the change is permitted.
grant update (status) on public.achados_perdidos to authenticated;

create or replace function private.guard_lost_found_submission_and_status()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;

  if tg_op = 'INSERT' then
    if not private.admin_mfa_verified(null, false) then
      new.status := 'pendente';
      if current_user = 'anon' then new.usuario_id := null; end if;
    end if;
  elsif not private.admin_mfa_verified(null, false) then
    if old.usuario_id is distinct from (select auth.uid())
       or old.status <> 'aprovado'
       or new.status <> 'resolvido'
       or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'Somente o proprietário pode marcar sua ocorrência aprovada como resolvida' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_lost_found_submission_and_status on public.achados_perdidos;
create trigger guard_lost_found_submission_and_status
  before insert or update on public.achados_perdidos
  for each row execute function private.guard_lost_found_submission_and_status();
