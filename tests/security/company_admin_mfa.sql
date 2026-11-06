-- Executar em transacao no SQL Editor sem alterar dados de clientes.
BEGIN;
DO $check$
DECLARE
 v_count integer;
BEGIN
 SELECT count(*) INTO v_count FROM pg_policies
 WHERE schemaname='public'
   AND tablename='usuario_empresa_admin'
   AND policyname='Admin geral com MFA gerencia atribuicoes'
   AND cmd='ALL'
   AND roles @> ARRAY['authenticated']::name[]
   AND qual LIKE '%admin_mfa_verified%'
   AND with_check LIKE '%admin_mfa_verified%';
 IF v_count <> 1 THEN
   RAISE EXCEPTION 'Atribuicoes de empresa sem MFA exigido';
 END IF;
 IF has_table_privilege('anon','public.usuario_empresa_admin','SELECT') THEN
   RAISE EXCEPTION 'Anon pode consultar atribuicoes de empresa';
 END IF;
END $check$;
SELECT set_config('request.jwt.claim.sub',
'00000000-0000-4000-8000-000000000000',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT count(*)=0 AS unauthenticated_identity_cannot_read_assignments
FROM public.usuario_empresa_admin;
RESET ROLE;
ROLLBACK;
