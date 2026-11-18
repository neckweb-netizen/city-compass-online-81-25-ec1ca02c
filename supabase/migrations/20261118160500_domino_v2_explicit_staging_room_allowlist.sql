-- PROTOTYPE ONLY. Issue #94, phase 6. Not deployed to production.
-- Opt in only manually authorized staging rooms. A regular signed-in player
-- must not be able to switch an active legacy domino game to v2 by invoking
-- domino_v2_iniciar_maos() directly.

CREATE TABLE private.domino_v2_salas_habilitadas (
  sala_id uuid PRIMARY KEY REFERENCES public.domino_salas(id) ON DELETE CASCADE,
  habilitada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.domino_v2_salas_habilitadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.domino_v2_salas_habilitadas
  FROM PUBLIC, anon, authenticated;
-- No client policies and no RPC to enroll: allowlist is populated only
-- by a trusted staging administrator after creating an isolated test room.

DO $migration$
DECLARE
  v_def text;
  v_anchor text := '  IF EXISTS (SELECT 1 FROM private.domino_v2_partidas WHERE sala_id = p_sala_id) THEN';
  v_guard text := $guard$
  IF NOT EXISTS (
    SELECT 1 FROM private.domino_v2_salas_habilitadas
    WHERE sala_id=p_sala_id
  ) THEN
    RAISE EXCEPTION 'Esta sala não está habilitada para dominó v2'
      USING ERRCODE='42501';
  END IF;

$guard$;
BEGIN
  v_def := pg_get_functiondef('public.domino_v2_iniciar_maos(uuid)'::regprocedure);
  IF (length(v_def)-length(replace(v_def,v_anchor,'')))/length(v_anchor) <> 1 THEN
    RAISE EXCEPTION 'Unexpected v2 initialization definition; aborting';
  END IF;
  EXECUTE replace(v_def,v_anchor,v_guard||v_anchor);
END
$migration$;

-- Before activating a staging room, an administrator should:
-- INSERT INTO private.domino_v2_salas_habilitadas (sala_id) VALUES ('<staging-room-uuid>');
-- NEVER opt in a room containing live players, a legacy game in progress,
-- or any real production data.
