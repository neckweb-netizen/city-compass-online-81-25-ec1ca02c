-- Only the appointment status may be changed by a company owner.
-- Full administrative edits continue to require city-scoped MFA.
create or replace function private.guard_booking_status_changes()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare v_city uuid;
begin
  if current_user <> 'authenticated' then return new; end if;
  select e.cidade_id into v_city from public.empresas e where e.id = old.empresa_id;
  if private.admin_mfa_verified(v_city, false) then return new; end if;

  if (to_jsonb(new) - 'status' - 'atualizado_em') is distinct from
     (to_jsonb(old) - 'status' - 'atualizado_em') then
    raise exception 'Somente o status do agendamento pode ser alterado pela empresa'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'pendente' and new.status in ('confirmado','cancelado')) or
    (old.status = 'confirmado' and new.status in ('concluido','cancelado'))
  ) then
    raise exception 'Transição de status do agendamento inválida'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_status_changes on public.agendamentos;
create trigger guard_booking_status_changes
before update on public.agendamentos
for each row execute function private.guard_booking_status_changes();
