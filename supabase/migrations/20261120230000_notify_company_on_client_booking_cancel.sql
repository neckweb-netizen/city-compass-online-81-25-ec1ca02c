-- When a signed-in customer cancels, notify the business owner as well.
-- Other status messages already notify the customer via the existing trigger.
create or replace function private.notify_appointment_status_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_title text;
  v_message text;
  v_owner uuid;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.cliente_usuario_id is not null then
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
    insert into public.notifications (
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
  end if;

  if new.status = 'cancelado'
     and old.cliente_usuario_id is not null
     and old.cliente_usuario_id = (select auth.uid()) then
    select e.usuario_id into v_owner from public.empresas e where e.id = new.empresa_id;
    if v_owner is not null and v_owner is distinct from old.cliente_usuario_id then
      insert into public.notifications (
        user_id, title, message, category, priority, action_url, action_label, metadata
      ) values (
        v_owner, 'Cliente cancelou um agendamento',
        'Um cliente cancelou uma reserva. Confira sua agenda.',
        'account', 'normal', '/empresa-dashboard', 'Ver agenda',
        jsonb_build_object(
          'event', 'appointment_cancelled_by_client',
          'appointment_id', new.id,
          'company_id', new.empresa_id
        )
      );
    end if;
  end if;

  return new;
end;
$$;
