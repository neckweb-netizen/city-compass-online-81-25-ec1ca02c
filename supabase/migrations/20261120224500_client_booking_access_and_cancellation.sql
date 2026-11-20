-- Authenticated clients may view their own bookings and cancel them.
-- Anonymous bookings remain accessible to the enterprise, not to unrelated accounts.
create policy "Clientes podem ver seus próprios agendamentos"
on public.agendamentos for select to authenticated
using (cliente_usuario_id = (select auth.uid()));

create policy "Clientes podem cancelar seus próprios agendamentos"
on public.agendamentos for update to authenticated
using (
  cliente_usuario_id = (select auth.uid())
  and status in ('pendente','confirmado')
)
with check (cliente_usuario_id = (select auth.uid()) and status = 'cancelado');

-- Owner/admin can manage allowed transitions; clients can only cancel.
create or replace function private.guard_booking_status_changes()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  v_city uuid;
  v_is_owner boolean;
begin
  if current_user <> 'authenticated' then return new; end if;
  select e.cidade_id, e.usuario_id = (select auth.uid())
  into v_city, v_is_owner
  from public.empresas e where e.id = old.empresa_id;

  if private.admin_mfa_verified(v_city, false) then return new; end if;

  if (to_jsonb(new) - 'status' - 'atualizado_em') is distinct from
     (to_jsonb(old) - 'status' - 'atualizado_em') then
    raise exception 'Somente o status do agendamento pode ser alterado'
      using errcode = '42501';
  end if;

  if not coalesce(v_is_owner, false)
     and (old.cliente_usuario_id is distinct from (select auth.uid())
       or new.status <> 'cancelado') then
    raise exception 'O cliente só pode cancelar seus próprios agendamentos'
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

-- A cancellation may come from the client or the business.
create or replace function private.notify_appointment_status_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_title text;
  v_message text;
begin
  if new.status is not distinct from old.status or new.cliente_usuario_id is null then
    return new;
  end if;
  case new.status
    when 'confirmado' then
      v_title := 'Agendamento confirmado';
      v_message := 'A empresa confirmou seu agendamento.';
    when 'cancelado' then
      v_title := 'Agendamento cancelado';
      v_message := 'Seu agendamento foi cancelado.';
    when 'concluido' then
      v_title := 'Agendamento concluído';
      v_message := 'Seu atendimento foi marcado como concluído.';
    else
      return new;
  end case;
  insert into public.notifications(
    user_id, title, message, category, priority, action_url, action_label, metadata
  ) values (
    new.cliente_usuario_id, v_title, v_message, 'account', 'normal',
    '/profile', 'Ver meus agendamentos',
    jsonb_build_object(
      'event', 'appointment_status_changed',
      'appointment_id', new.id,
      'company_id', new.empresa_id,
      'status', new.status
    )
  );
  return new;
end;
$$;
