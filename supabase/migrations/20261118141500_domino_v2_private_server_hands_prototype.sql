-- PROTOTYPE ONLY — not deployed to Supabase production.
-- Issue #94, phase 1: a cryptographically shuffled, server-owned private hand.
-- No UI or existing domino functions call this code. Not a complete anticheat solution.
-- This migration must be reviewed and tested in an isolated Supabase branch before merge.

CREATE TABLE private.domino_v2_partidas (
  sala_id uuid PRIMARY KEY REFERENCES public.domino_salas(id) ON DELETE CASCADE,
  jogador_1_id uuid NOT NULL REFERENCES auth.users(id),
  jogador_2_id uuid NOT NULL REFERENCES auth.users(id),
  criada_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domino_v2_distinct_players CHECK (jogador_1_id <> jogador_2_id)
);

CREATE TABLE private.domino_v2_maos (
  sala_id uuid NOT NULL REFERENCES private.domino_v2_partidas(sala_id) ON DELETE CASCADE,
  jogador_id uuid NOT NULL REFERENCES auth.users(id),
  pedra text NOT NULL,
  PRIMARY KEY (sala_id, pedra),
  CONSTRAINT domino_v2_canonical_tile CHECK (
    pedra ~ '^[0-6]-[0-6]$'
    AND left(pedra, 1)::integer <= right(pedra, 1)::integer
  )
);
CREATE INDEX domino_v2_maos_jogador_idx
  ON private.domino_v2_maos (sala_id, jogador_id);

ALTER TABLE private.domino_v2_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.domino_v2_maos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.domino_v2_partidas, private.domino_v2_maos
  FROM PUBLIC, anon, authenticated;
-- No RLS policies: clients cannot enumerate or modify hands directly.

CREATE OR REPLACE FUNCTION public.domino_v2_iniciar_maos(p_sala_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_sala public.domino_salas%ROWTYPE;
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_sala
  FROM public.domino_salas
  WHERE id = p_sala_id FOR UPDATE;

  IF NOT FOUND OR v_sala.status <> 'jogando'
     OR v_sala.jogador_1_id IS NULL OR v_sala.jogador_2_id IS NULL
     OR v_sala.jogador_1_id = v_sala.jogador_2_id
     OR v_uid NOT IN (v_sala.jogador_1_id, v_sala.jogador_2_id)
  THEN
    RAISE EXCEPTION 'Partida indisponível' USING ERRCODE='42501';
  END IF;

  IF EXISTS (SELECT 1 FROM private.domino_v2_partidas WHERE sala_id = p_sala_id) THEN
    -- Never redraw or expose a hand to another participant on retry.
    RETURN false;
  END IF;
  IF COALESCE(jsonb_array_length(v_sala.historico_jogadas), 0) <> 0
     OR COALESCE(v_sala.passadas_count, 0) <> 0
     OR COALESCE(v_sala.jogadas_jogador_1, 0) <> 0
     OR COALESCE(v_sala.jogadas_jogador_2, 0) <> 0
     OR v_sala.resultado_registrado
  THEN
    RAISE EXCEPTION 'A partida já começou e não pode receber nova distribuição';
  END IF;

  INSERT INTO private.domino_v2_partidas (sala_id, jogador_1_id, jogador_2_id)
  VALUES (p_sala_id, v_sala.jogador_1_id, v_sala.jogador_2_id);

  -- 28 canonical pieces (0-0 .. 6-6). Each is drawn at most once.
  -- gen_random_uuid() is backed by PostgreSQL cryptographic randomness;
  -- never derive the draw from public sala_id or client-provided data.
  WITH deck AS (
    SELECT a.n::text || '-' || b.n::text AS pedra,
           row_number() OVER (ORDER BY gen_random_uuid()) AS pos
    FROM generate_series(0,6) AS a(n)
    CROSS JOIN generate_series(0,6) AS b(n)
    WHERE a.n <= b.n
  )
  INSERT INTO private.domino_v2_maos (sala_id, jogador_id, pedra)
  SELECT p_sala_id,
         CASE WHEN pos <= 7 THEN v_sala.jogador_1_id ELSE v_sala.jogador_2_id END,
         pedra
  FROM deck
  WHERE pos <= 14;

  IF (SELECT count(*) FROM private.domino_v2_maos WHERE sala_id = p_sala_id) <> 14
     OR (SELECT count(*) FROM private.domino_v2_maos
          WHERE sala_id=p_sala_id AND jogador_id=v_sala.jogador_1_id) <> 7
     OR (SELECT count(*) FROM private.domino_v2_maos
          WHERE sala_id=p_sala_id AND jogador_id=v_sala.jogador_2_id) <> 7
  THEN
    RAISE EXCEPTION 'Falha ao distribuir peças do dominó';
  END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.domino_v2_minha_mao(p_sala_id uuid)
RETURNS TABLE(pedra text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1
    FROM private.domino_v2_partidas p
    JOIN public.domino_salas s ON s.id=p.sala_id
    WHERE p.sala_id=p_sala_id
      AND v_uid IN (p.jogador_1_id,p.jogador_2_id)
      AND v_uid IN (s.jogador_1_id,s.jogador_2_id)
  ) THEN
    RAISE EXCEPTION 'Sem acesso à mão desta partida' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT m.pedra
  FROM private.domino_v2_maos m
  WHERE m.sala_id=p_sala_id AND m.jogador_id=v_uid
  ORDER BY m.pedra;
END;
$function$;

REVOKE ALL ON FUNCTION public.domino_v2_iniciar_maos(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.domino_v2_minha_mao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.domino_v2_iniciar_maos(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.domino_v2_minha_mao(uuid) TO authenticated;
