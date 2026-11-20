-- Agendamentos: impedir edição de dados privados e transições de status indevidas.
-- O processamento interno via service_role permanece intacto.
create or replace function private.guard_appointment_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  -- Apenas a operação de status é permitida no cliente. Os timestamps automáticos
  -- são mantidos pelo gatilho existente.
  if (to_jsonb(new) - 'status' - 'atualizado_em')
     is distinct from (to_jsonb(old) - 'status' - 'atualizado_em') then
    raise exception 'Apenas o status do agendamento pode ser alterado'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'pendente' and new.status in ('confirmado', 'cancelado'))
    or (old.status = 'confirmado' and new.status in ('concluido', 'cancelado'))
  ) then
    raise exception 'Transição de status do agendamento não permitida'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_appointment_status_transition on public.agendamentos;
create trigger guard_appointment_status_transition
before update on public.agendamentos
for each row execute function private.guard_appointment_status_transition();

-- Restrição adicional à superfície da API: somente coluna de status é editável.
revoke update on public.agendamentos from authenticated;
grant update (status) on public.agendamentos to authenticated;
