-- Teste transacional de segurança. Não cria usuários reais.
-- Executar com um papel administrativo em Supabase SQL Editor.
-- Tudo é revertido ao final; todos os IDs e dados aqui são fictícios.
BEGIN;
CREATE TEMP TABLE _profile_entitlement_guard_test
  (LIKE public.usuarios INCLUDING DEFAULTS) ON COMMIT DROP;
INSERT INTO _profile_entitlement_guard_test
  (id, nome, email, tipo_conta, cidade_id, plano_data_vencimento)
VALUES
  ('11111111-1111-4111-8111-111111111111','Security Probe',
   'security-probe@example.invalid','usuario',
   '22222222-2222-4222-8222-222222222222','2026-11-10T00:00:00Z');

CREATE TRIGGER test_profile_guard BEFORE UPDATE ON _profile_entitlement_guard_test
FOR EACH ROW EXECUTE FUNCTION private.protect_user_sensitive_profile_fields();
GRANT SELECT, UPDATE ON _profile_entitlement_guard_test TO authenticated;

SELECT set_config('request.jwt.claim.sub',
                  '11111111-1111-4111-8111-111111111111',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;

UPDATE _profile_entitlement_guard_test
SET nome='Updated display name',
    cidade_id='33333333-3333-4333-8333-333333333333',
    plano_id='44444444-4444-4444-8444-444444444444',
    plano_data_vencimento='2099-01-01T00:00:00Z',
    tipo_conta='admin_geral'
WHERE id='11111111-1111-4111-8111-111111111111';

DO $test$
DECLARE test_row RECORD;
BEGIN
 SELECT nome,cidade_id,plano_id,plano_data_vencimento,tipo_conta
 INTO test_row FROM _profile_entitlement_guard_test LIMIT 1;
 IF test_row.nome <> 'Updated display name'
 OR test_row.cidade_id <> '22222222-2222-4222-8222-222222222222'::uuid
 OR test_row.plano_id IS NOT NULL
 OR test_row.plano_data_vencimento <> '2026-11-10T00:00:00Z'::timestamptz
 OR test_row.tipo_conta::text <> 'usuario'
 THEN
  RAISE EXCEPTION 'SECURITY TEST FAILED: profile field escalation not blocked';
 END IF;
END $test$;

RESET ROLE;
ROLLBACK; -- Testes não deixam nenhuma alteração persistente.
