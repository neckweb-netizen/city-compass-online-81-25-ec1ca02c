-- Logs contain user identity, IP, and user-agent. Restrict global visibility
-- to general admins with MFA; municipal admins may view only logs whose
-- subject belongs to the municipality, also requiring MFA.
DROP POLICY IF EXISTS "Admins podem ver logs de segurança" ON public.security_logs;
CREATE POLICY "Administradores com MFA veem logs de seu escopo"
ON public.security_logs FOR SELECT TO authenticated
USING (
  private.admin_mfa_verified(NULL::uuid, true)
  OR EXISTS (
    SELECT 1
    FROM public.usuarios subject
    WHERE subject.id = security_logs.user_id
      AND subject.cidade_id IS NOT NULL
      AND private.admin_mfa_verified(subject.cidade_id, false)
  )
);

-- All writes are performed server-side by the log-security-event Edge Function.
-- Do not allow clients to alter or fabricate log rows via the Data API.
REVOKE INSERT, UPDATE, DELETE ON public.security_logs FROM anon, authenticated;
