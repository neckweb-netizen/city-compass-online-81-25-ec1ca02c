-- Already applied to production Supabase as migration 20261118111154.
-- Lock the selected domino queue row to prevent concurrent consumers
-- claiming the same player. Existing room lock and waiting-only selector remain.
DO $migration$
DECLARE
  v_before text;
  v_after text;
  v_pattern text := 'ORDER BY entrou_em ASC[[:space:]]+LIMIT 1;';
BEGIN
  v_before := pg_get_functiondef('public.processar_fila_domino()'::regprocedure);
  IF (select count(*) from regexp_matches(v_before,v_pattern,'g')) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one queue selector; no change applied';
  END IF;
  v_after := regexp_replace(v_before,v_pattern,'ORDER BY entrou_em ASC LIMIT 1 FOR UPDATE SKIP LOCKED;','i');
  IF position('ORDER BY entrou_em ASC LIMIT 1 FOR UPDATE SKIP LOCKED;' in v_after) = 0 THEN
    RAISE EXCEPTION 'Queue lock missing; no change applied';
  END IF;
  EXECUTE v_after;
END
$migration$;
