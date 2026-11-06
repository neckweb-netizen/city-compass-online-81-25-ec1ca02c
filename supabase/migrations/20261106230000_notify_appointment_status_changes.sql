-- Avisa no aplicativo o cliente autenticado apenas quando o status
-- do seu agendamento mudar. Nao envia mensagens externas ou cobranças.
-- Clientes anonimos nao possuem user_id para uma notificacao in-app.
CREATE OR REPLACE FUNCTION private.notify_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     OR NEW.cliente_usuario_id IS NULL THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'confirmado' THEN
      v_title := 'Agendamento confirmado';
      v_message := 'A empresa confirmou seu agendamento.';
    WHEN 'cancelado' THEN
      v_title := 'Agendamento cancelado';
      v_message := 'Seu agendamento foi cancelado pela empresa.';
    WHEN 'concluido' THEN
      v_title := 'Agendamento concluído';
      v_message := 'Seu atendimento foi marcado como concluído.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications(
    user_id, title, message, category, priority,
    action_url, action_label, metadata
  ) VALUES (
    NEW.cliente_usuario_id, v_title, v_message, 'account', 'normal',
    '/notificacoes', 'Ver notificação',
    jsonb_build_object(
      'event', 'appointment_status_changed',
      'appointment_id', NEW.id,
      'company_id', NEW.empresa_id,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_appointment_status_change()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_appointment_status_change ON public.agendamentos;
CREATE TRIGGER notify_appointment_status_change
AFTER UPDATE OF status ON public.agendamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION private.notify_appointment_status_change();
