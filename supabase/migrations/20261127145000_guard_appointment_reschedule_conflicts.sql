CREATE OR REPLACE FUNCTION private.prevent_appointment_update_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_start_local timestamp;
BEGIN
  IF NEW.status NOT IN ('pendente', 'confirmado') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('pendente', 'confirmado')
     AND NEW.status = OLD.status
     AND NEW.duracao_minutos IS NOT DISTINCT FROM OLD.duracao_minutos
     AND NEW.data_agendamento IS NOT DISTINCT FROM OLD.data_agendamento
     AND NEW.empresa_id IS NOT DISTINCT FROM OLD.empresa_id THEN
    RETURN NEW;
  END IF;

  v_start_local := NEW.data_agendamento AT TIME ZONE 'America/Bahia';
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.empresa_id::text || v_start_local::date::text, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.empresa_id = NEW.empresa_id
      AND a.id <> NEW.id
      AND a.status IN ('pendente', 'confirmado')
      AND tstzrange(
        a.data_agendamento,
        a.data_agendamento + make_interval(mins => a.duracao_minutos),
        '[)'
      ) && tstzrange(
        NEW.data_agendamento,
        NEW.data_agendamento + make_interval(mins => NEW.duracao_minutos),
        '[)'
      )
  ) THEN
    RAISE EXCEPTION 'Este horário já está reservado. Escolha outro horário'
      USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END;
$function$
