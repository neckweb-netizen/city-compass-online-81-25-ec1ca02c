\set ON_ERROR_STOP on
\echo '=== Domino V2: staging-only SQL integration ==='

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

RESET ROLE;
DO $test$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM private.domino_v2_maos
  WHERE sala_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  IF v_count <> 13 THEN RAISE EXCEPTION 'FAIL: dealt hands now total %',v_count; END IF;
END
$test$;
\echo '=== Domino V2 staging integration passed ==='
