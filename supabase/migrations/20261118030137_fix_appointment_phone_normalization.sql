-- Already applied to production Supabase as migration 20261118030137.
-- Correct phone normalization in the appointment validator without touching
-- its remaining validation logic, grants or ownership.
DO $migration$
DECLARE
  v_original text;
  v_updated text;
  v_old text := chr(39) || repeat(chr(92), 2) || 'D' || chr(39);
  v_new text := chr(39) || '[^0-9]' || chr(39);
BEGIN
  v_original := pg_get_functiondef('public.validar_agendamento_antes_insert()'::regprocedure);
  IF (length(v_original)-length(replace(v_original,v_old,'')))/length(v_old) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one double-escaped phone regex, found %',
      (length(v_original)-length(replace(v_original,v_old,'')))/length(v_old);
  END IF;
  v_updated := replace(v_original,v_old,v_new);
  EXECUTE v_updated;
END
$migration$;
