\set ON_ERROR_STOP on
\echo '=== Domino V2: victory, RLS and reset tests (disposable PostgreSQL) ==='

-- This test runs only against ephemeral domino_v2_ci after integration.sql.
-- Simulated JWT claims are not a substitute for Supabase Auth JWT verification.
DO $assert$
BEGIN
  IF current_database() <> 'domino_v2_ci' THEN
    RAISE EXCEPTION 'Refusing to run outside disposable database';
  END IF;
END
$assert$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

DO $assert$
BEGIN
  BEGIN
    PERFORM count(*) FROM private.domino_v2_maos;
    RAISE EXCEPTION 'FAIL: authenticated can enumerate private hands';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO private.domino_v2_salas_habilitadas(sala_id)
    VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    RAISE EXCEPTION 'FAIL: user can enroll legacy room into V2';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$assert$;
RESET ROLE;

-- Synthetic near-finished game, deliberately configured by test DB admin.
INSERT INTO public.domino_salas
 (id,numero_sala,status,jogador_1_id,jogador_2_id,vez_usuario_id)
VALUES
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',5,'jogando',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111');

INSERT INTO private.domino_v2_partidas(sala_id,jogador_1_id,jogador_2_id)
VALUES
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222');

INSERT INTO private.domino_v2_maos(sala_id,jogador_id,pedra)
VALUES
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111','2-2'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '22222222-2222-4222-8222-222222222222','1-1');

SET ROLE authenticated;
SET request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
DO $assert$
BEGIN
  BEGIN
    PERFORM public.domino_v2_jogar(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','2-2','esquerda');
    RAISE EXCEPTION 'FAIL: unauthorized third party played a tile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$assert$;

SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $assert$
BEGIN
  BEGIN
    PERFORM public.domino_v2_jogar(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','1-1','esquerda');
    RAISE EXCEPTION 'FAIL: player outside turn played a tile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$assert$;

SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $assert$
DECLARE result jsonb;
BEGIN
  result := public.domino_v2_jogar(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','2-2','esquerda');
  IF (result->>'pecas_restantes')::integer <> 0 THEN
    RAISE EXCEPTION 'FAIL: winner still holds tiles';
  END IF;
  BEGIN
    PERFORM public.domino_v2_jogar(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','2-2','esquerda');
    RAISE EXCEPTION 'FAIL: a finalized match accepted another move';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.domino_v2_passar(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','sem_peca');
    RAISE EXCEPTION 'FAIL: a finalized match accepted a pass';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$assert$;
RESET ROLE;

DO $assert$
DECLARE v_status text; v_wins int; v_losses int;
        v_score_winner int; v_score_loser int;
BEGIN
  SELECT status INTO v_status FROM public.domino_salas
    WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      AND resultado_registrado AND vencedor_id='11111111-1111-4111-8111-111111111111';
  IF v_status IS DISTINCT FROM 'finalizada' THEN
    RAISE EXCEPTION 'FAIL: empty-hand win was not finalized';
  END IF;
  SELECT vitorias,pontuacao INTO v_wins,v_score_winner FROM public.domino_estatisticas
    WHERE usuario_id='11111111-1111-4111-8111-111111111111';
  SELECT derrotas,pontuacao INTO v_losses,v_score_loser FROM public.domino_estatisticas
    WHERE usuario_id='22222222-2222-4222-8222-222222222222';
  IF v_wins <> 1 OR v_losses <> 1 OR v_score_winner <> 4 OR v_score_loser <> 0 THEN
    RAISE EXCEPTION 'FAIL: scores not recorded exactly once (%/%/%/%)',
      v_wins,v_losses,v_score_winner,v_score_loser;
  END IF;
END
$assert$;

-- Reset a finished room, preserving cumulative ranking but removing old private hands.
UPDATE public.domino_salas
SET status='aguardando', jogador_1_id=NULL, jogador_2_id=NULL,
    vez_usuario_id=NULL
WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

DO $assert$
BEGIN
  IF EXISTS (SELECT 1 FROM private.domino_v2_partidas
     WHERE sala_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
     OR EXISTS (SELECT 1 FROM private.domino_v2_maos
     WHERE sala_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
  THEN
    RAISE EXCEPTION 'FAIL: reset did not cascade clean old hands';
  END IF;
  IF (SELECT vitorias FROM public.domino_estatisticas
      WHERE usuario_id='11111111-1111-4111-8111-111111111111') <> 1 THEN
    RAISE EXCEPTION 'FAIL: reset unexpectedly changed winner statistics';
  END IF;
END
$assert$;

\echo 'PASS: third-party isolation, empty-hand win, score-once and room cleanup.'
