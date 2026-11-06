-- Teste seguro: verifica gatilho de notificação sem enviar mensagens nem alterar dados.
BEGIN;
DO $check$
DECLARE
  v_trigger boolean;
  v_function text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid='public.agendamentos'::regclass
      AND t.tgname='notify_appointment_status_change'
      AND t.tgenabled='O'
      AND pg_get_triggerdef(t.oid) ILIKE '%AFTER UPDATE OF status%'
      AND pg_get_triggerdef(t.oid) ILIKE '%IS DISTINCT FROM%'
  ) INTO v_trigger;
  IF NOT v_trigger THEN RAISE EXCEPTION 'Gatilho de mudança de status ausente'; END IF;

  SELECT pg_get_functiondef('private.notify_appointment_status_change()'::regprocedure)
  INTO v_function;
  IF v_function NOT ILIKE '%cliente_usuario_id IS NULL%'
     OR v_function NOT ILIKE '%appointment_status_changed%'
     OR v_function NOT ILIKE '%confirmado%'
     OR v_function NOT ILIKE '%cancelado%'
     OR v_function NOT ILIKE '%concluido%'
  THEN
    RAISE EXCEPTION 'Notificação sem controle de destinatário ou estados';
  END IF;

  IF has_function_privilege('anon','private.notify_appointment_status_change()','EXECUTE')
     OR has_function_privilege('authenticated','private.notify_appointment_status_change()','EXECUTE')
  THEN
    RAISE EXCEPTION 'Execução direta da notificação exposta';
  END IF;
END $check$;
SELECT COUNT(*) = 0 AS sem_agendamentos_de_teste_criados
FROM public.agendamentos
WHERE empresa_id = '00000000-0000-4000-8000-000000000000'::uuid;
ROLLBACK;
