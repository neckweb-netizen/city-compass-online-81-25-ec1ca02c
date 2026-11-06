-- Admin assignments are security-sensitive: require a general administrator
-- with an AAL2 (MFA) session for INSERT, UPDATE and DELETE operations.
-- Retain self-SELECT policy for active assignments.
DROP POLICY IF EXISTS "Admin geral pode gerenciar todas as atribuições"
ON public.usuario_empresa_admin;

CREATE POLICY "Admin geral com MFA gerencia atribuicoes"
ON public.usuario_empresa_admin
FOR ALL
TO authenticated
USING (private.admin_mfa_verified(NULL::uuid, true))
WITH CHECK (private.admin_mfa_verified(NULL::uuid, true));
