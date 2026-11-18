\set ON_ERROR_STOP on
\echo '=== Domino V2: staging-only SQL integration ==='

-- Attach the same anti-cheat BEFORE UPDATE trigger used in production.
-- This fixture checks that private v2 isolation does not break legacy moves.
CREATE TRIGGER guard_domino_sala_update_trigger
BEFORE UPDATE ON public.domino_salas
FOR EACH ROW EXECUTE FUNCTION private.guard_domino_sala_update();

-- All migration SQL is executed in a disposable PostgreSQL service.
-- Never run this test against the live Supabase database.
DO $test$
BEGIN
  BEGIN
    PERFORM public.domino_v2_iniciar_maos('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
    RAISE EXCEPTION 'FAIL: unauthenticated setup succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
BEGIN
  BEGIN
    PERFORM public.domino_v2_iniciar_maos('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
    RAISE EXCEPTION 'FAIL: player enabled v2 without server approval';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
RESET ROLE;

INSERT INTO private.domino_v2_salas_habilitadas (sala_id)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE
  v_first boolean;
  v_again boolean;
  v_count integer;
BEGIN
  v_first := public.domino_v2_iniciar_maos('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
  v_again := public.domino_v2_iniciar_maos('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
  IF NOT v_first OR v_again THEN
    RAISE EXCEPTION 'FAIL: initial dealing not idempotent';
  END IF;
  SELECT count(*) INTO v_count
  FROM public.domino_v2_minha_mao('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
  IF v_count <> 7 THEN RAISE EXCEPTION 'FAIL: user A received % tiles',v_count; END IF;
END
$test$;

SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $test$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.domino_v2_minha_mao('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
  IF v_count <> 7 THEN RAISE EXCEPTION 'FAIL: user B received % tiles',v_count; END IF;
END
$test$;

SET request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
DO $test$
BEGIN
  BEGIN
    PERFORM public.domino_v2_minha_mao('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
    RAISE EXCEPTION 'FAIL: third party read private tiles';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.domino_v2_iniciar_maos('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid);
    RAISE EXCEPTION 'FAIL: third party dealt tiles';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE
  v_tile text;
  v_result jsonb;
  v_remaining integer;
BEGIN
  BEGIN
    PERFORM public.domino_v2_jogar('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'0-7','esquerda');
    RAISE EXCEPTION 'FAIL: invalid tile accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.domino_v2_jogar('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'0-7','direita');
    RAISE EXCEPTION 'FAIL: invalid tile accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.domino_v2_passar('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,'tempo');
    RAISE EXCEPTION 'FAIL: unverified timeout accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  SELECT pedra INTO v_tile FROM public.domino_v2_minha_mao('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid) LIMIT 1;
  BEGIN
    UPDATE public.domino_salas SET historico_jogadas = jsonb_build_array(
      jsonb_build_object('valorOriginal', v_tile, 'ladoEsquerdo', 0, 'ladoDireito', 0))
    WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    RAISE EXCEPTION 'FAIL: direct v2 board UPDATE bypassed RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  v_result := public.domino_v2_jogar('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,v_tile,'esquerda');
  IF (v_result->>'pecas_restantes')::integer <> 6 THEN
    RAISE EXCEPTION 'FAIL: tile not consumed';
  END IF;
  SELECT count(*) INTO v_remaining
  FROM public.domino_v2_minha_mao('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid);
  IF v_remaining <> 6 THEN
    RAISE EXCEPTION 'FAIL: persisted hand has % tiles',v_remaining;
  END IF;
  BEGIN
    PERFORM public.domino_v2_jogar('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,v_tile,'esquerda');
    RAISE EXCEPTION 'FAIL: replay accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

-- Legacy game without private v2 state must remain writable by its player.
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE v_history jsonb;
BEGIN
  v_history := jsonb_build_array(jsonb_build_object(
    'valorOriginal','0-0','ladoEsquerdo',0,'ladoDireito',0));
  UPDATE public.domino_salas
  SET historico_jogadas = v_history,
      mesa_ponta_esquerda = 0,
      mesa_ponta_direita = 0
  WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
END
$test$;

RESET ROLE;
DO $test$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM private.domino_v2_maos
  WHERE sala_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  IF v_count <> 13 THEN RAISE EXCEPTION 'FAIL: dealt hands now total %',v_count; END IF;
END
$test$;
-- A controlled, isolated blocked-board scenario exercises real RPCs and scoring.
-- Admin setup is permissible ONLY in this throwaway test database.
INSERT INTO public.domino_salas
  (id,numero_sala,status,jogador_1_id,jogador_2_id,vez_usuario_id,
   historico_jogadas,mesa_ponta_esquerda,mesa_ponta_direita)
VALUES
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',3,'jogando',
   '11111111-1111-4111-8111-111111111111',
   '22222222-2222-4222-8222-222222222222',
   '11111111-1111-4111-8111-111111111111',
   '[{"valorOriginal":"6-6","ladoEsquerdo":6,"ladoDireito":6}]'::jsonb,
   6,6);
INSERT INTO private.domino_v2_partidas (sala_id,jogador_1_id,jogador_2_id)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222');
INSERT INTO private.domino_v2_maos(sala_id,jogador_id,pedra)
VALUES
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '11111111-1111-4111-8111-111111111111','0-0'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '11111111-1111-4111-8111-111111111111','0-6'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '22222222-2222-4222-8222-222222222222','1-1');

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
BEGIN
  BEGIN
    PERFORM public.domino_v2_passar('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,'sem_peca');
    RAISE EXCEPTION 'FAIL: a playable tile did not block pass';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
RESET ROLE;

-- Remove only the moveable piece so both players are genuinely blocked.
DELETE FROM private.domino_v2_maos
WHERE sala_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  AND pedra='0-6';

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE v_result jsonb;
BEGIN
  v_result := public.domino_v2_passar('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,'sem_peca');
  IF (v_result->>'nova_contagem_passadas')::integer <> 1 THEN
    RAISE EXCEPTION 'FAIL: first validated pass not recorded';
  END IF;
END
$test$;

SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $test$
DECLARE v_result jsonb;
BEGIN
  v_result := public.domino_v2_passar('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,'sem_peca');
  IF (v_result->>'jogo_trancado')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: verified draw not finalized';
  END IF;
  BEGIN
    PERFORM public.domino_v2_passar('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,'sem_peca');
    RAISE EXCEPTION 'FAIL: finalized match accepted a duplicate pass';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
RESET ROLE;

DO $test$
DECLARE v_count integer; v_status text;
BEGIN
  SELECT status INTO v_status FROM public.domino_salas
    WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  IF v_status <> 'finalizada' THEN
    RAISE EXCEPTION 'FAIL: blocked match status = %',v_status;
  END IF;
  SELECT count(*) INTO v_count FROM public.domino_estatisticas
  WHERE usuario_id IN
    ('11111111-1111-4111-8111-111111111111',
     '22222222-2222-4222-8222-222222222222')
    AND empates=1 AND partidas_jogadas=1 AND pontuacao=1;
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'FAIL: expected exactly one recorded draw per player';
  END IF;
END
$test$;

\echo '=== Domino V2 staging integration passed ==='
