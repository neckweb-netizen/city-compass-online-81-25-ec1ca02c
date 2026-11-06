-- SQL read-only rollback smoke test for account/city isolation.
BEGIN;
DO $guard$
DECLARE
 v_company_admin jsonb;
 v_policies integer;
BEGIN
 SELECT to_jsonb(p) INTO v_company_admin
 FROM pg_policies p
 WHERE p.schemaname='public'
 AND p.tablename='usuario_empresa_admin'
 AND p.policyname='Admin geral com MFA gerencia atribuicoes';
 IF v_company_admin IS NULL
    OR v_company_admin->>'cmd' <> 'ALL'
    OR v_company_admin->>'qual' NOT LIKE '%admin_mfa_verified%'
    OR v_company_admin->>'with_check' NOT LIKE '%admin_mfa_verified%' THEN
   RAISE EXCEPTION 'Company admin assignments not protected by MFA';
 END IF;
 SELECT COUNT(*) INTO v_policies
 FROM pg_policies p
 WHERE p.schemaname='public'
 AND p.tablename='agendamentos'
 AND p.policyname IN (
   'Admins podem gerenciar agendamentos',
   'Empresas podem ver seus agendamentos',
   'Empresas podem atualizar seus agendamentos'
 )
 AND p.qual LIKE '%admin_mfa_verified(e.cidade_id, false)%'
 AND (p.cmd = 'SELECT' OR p.with_check LIKE '%admin_mfa_verified(e.cidade_id, false)%');
 IF v_policies <> 3 THEN
   RAISE EXCEPTION 'Booking policies allow unscoped municipal access (%)',v_policies;
 END IF;
END $guard$;
SELECT set_config('request.jwt.claim.sub',
 '00000000-0000-4000-8000-000000000000',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT count(*) = 0 AS unknown_identity_cannot_see_assignments FROM public.usuario_empresa_admin;
SELECT count(*) = 0 AS unknown_identity_cannot_see_bookings FROM public.agendamentos;
RESET ROLE;
ROLLBACK;
