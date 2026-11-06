-- Regression test for audit access and rate-limit counters.
-- Run in SQL Editor. Transaction rollback leaves no counters or data changes.
BEGIN;
DO $test$
BEGIN
 IF has_table_privilege('anon','public.security_logs','SELECT')
 OR has_table_privilege('authenticated','public.security_logs','INSERT')
 OR has_table_privilege('authenticated','public.security_logs','UPDATE')
 OR has_table_privilege('authenticated','public.security_logs','DELETE')
 OR NOT has_table_privilege('service_role','public.security_logs','INSERT')
 THEN
   RAISE EXCEPTION 'Security logs client access regression';
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='security_logs' AND cmd='SELECT'
   AND qual LIKE '%admin_mfa_verified%'
 ) THEN
   RAISE EXCEPTION 'Security log policy missing city/MFA scope';
 END IF;
END $test$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000000',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT count(*)=0 AS unknown_user_cannot_read_logs FROM public.security_logs;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $limit$
DECLARE one boolean; two boolean; three boolean;
BEGIN
 SELECT public.consume_edge_rate_limit('audit-regression-20261106',2,60) INTO one;
 SELECT public.consume_edge_rate_limit('audit-regression-20261106',2,60) INTO two;
 SELECT public.consume_edge_rate_limit('audit-regression-20261106',2,60) INTO three;
 IF NOT one OR NOT two OR three THEN
   RAISE EXCEPTION 'Rate limit bypass detected';
 END IF;
END $limit$;
ROLLBACK;
