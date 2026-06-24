-- Remove the problematic security_dashboard view that bypasses RLS
DROP VIEW IF EXISTS public.security_dashboard;

-- The security_logs table already has proper RLS policies:
-- "Admins podem ver logs de segurança" policy ensures only admins can access
-- So we should query security_logs directly instead of using a view