-- PROTOTYPE ONLY — not deployed to production.
-- Phase 5: preserve legacy authenticated domino moves while isolating v2 private tables.
-- The legacy UPDATE trigger is SECURITY INVOKER, so it cannot query a private table
-- with no authenticated SELECT grant. Use a narrow SECURITY DEFINER existence check.

CREATE OR REPLACE FUNCTION private.domino_v2_partida_existe(p_sala_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS(
    SELECT 1
    FROM private.domino_v2_partidas p
    WHERE p.sala_id=p_sala_id
  );
$function$;

REVOKE ALL ON FUNCTION private.domino_v2_partida_existe(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.domino_v2_partida_existe(uuid)
TO authenticated;

-- Replace only the v2 presence guard. All other legacy anti-cheat rules remain.
DO $migration$
DECLARE
  v_def text;
  v_old text := E'  IF EXISTS (\n    SELECT 1 FROM private.domino_v2_partidas\n    WHERE sala_id=old.id\n  ) THEN';
  v_new text := '  IF private.domino_v2_partida_existe(old.id) THEN';
BEGIN
  v_def := pg_get_functiondef('private.guard_domino_sala_update()'::regprocedure);
  IF (length(v_def)-length(replace(v_def,v_old,'')))/length(v_old) <> 1 THEN
    RAISE EXCEPTION 'Unexpected v2 guard definition; no change applied';
  END IF;
  EXECUTE replace(v_def,v_old,v_new);
END
$migration$;
