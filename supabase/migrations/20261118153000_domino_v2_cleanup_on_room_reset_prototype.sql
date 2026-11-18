-- PROTOTYPE ONLY — Issue #94; do not deploy to production.
-- Phase 4: clean up private v2 hands when a room is reset or its players change.
-- A completed game retains its state until the room is actually reused.
-- This is a database trigger so the existing sair_lobby_domino() and other
-- authorized reset paths cannot leave stale hands bound to the same sala_id.

CREATE OR REPLACE FUNCTION private.domino_v2_limpar_apos_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Identificador da sala não pode ser alterado'
      USING ERRCODE = '42501';
  END IF;

  IF (OLD.jogador_1_id IS DISTINCT FROM NEW.jogador_1_id
      OR OLD.jogador_2_id IS DISTINCT FROM NEW.jogador_2_id
      OR (OLD.status IS DISTINCT FROM NEW.status
          AND NEW.status = 'aguardando'))
     AND EXISTS (
       SELECT 1 FROM private.domino_v2_partidas p
       WHERE p.sala_id = OLD.id
     )
  THEN
    -- ON DELETE CASCADE also removes all tiles for both previous players.
    -- Since the room UPDATE already holds the row lock, concurrent moves
    -- that lock this same room are serialized with the cleanup.
    DELETE FROM private.domino_v2_partidas
    WHERE sala_id = OLD.id;
  END IF;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.domino_v2_limpar_apos_reset()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER domino_v2_limpar_apos_reset_trigger
AFTER UPDATE OF jogador_1_id, jogador_2_id, status
ON public.domino_salas
FOR EACH ROW
EXECUTE FUNCTION private.domino_v2_limpar_apos_reset();
