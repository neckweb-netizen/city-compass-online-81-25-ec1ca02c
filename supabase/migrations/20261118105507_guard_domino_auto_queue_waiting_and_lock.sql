-- Already applied to production Supabase as migration 20261118105507.
-- Restrict automatic domino queue matching to waiting rooms and lock selected room.
-- Preserve function permissions and matchmaking behavior otherwise.
DO $migration$
DECLARE
  v_old text;
  v_new text;
  v_predicate text := 'WHERE status != ' || chr(39) || 'finalizada' || chr(39);
BEGIN
  v_old := pg_get_functiondef('public.processar_fila_domino()'::regprocedure);
  IF (length(v_old)-length(replace(v_old,v_predicate,'')))/length(v_predicate) <> 1 THEN
    RAISE EXCEPTION 'Unexpected automatic domino selector; no changes applied';
  END IF;
  v_new := replace(v_old,v_predicate,'WHERE status = ' || chr(39) || 'aguardando' || chr(39));
  v_new := regexp_replace(v_new,'(ORDER BY numero_sala ASC[[:space:]]+LIMIT 1);',E'\\1 FOR UPDATE SKIP LOCKED;','i');
  IF v_new = replace(v_old,v_predicate,'WHERE status = ' || chr(39) || 'aguardando' || chr(39))
     OR position('FOR UPDATE SKIP LOCKED' in v_new)=0 THEN
    RAISE EXCEPTION 'Unable to add row lock to automatic domino queue; no changes applied';
  END IF;
  EXECUTE v_new;
END
$migration$;
