-- Internal support events are written with service_role. Public callers must
-- not be able to forge audit entries or fill the table with arbitrary data.
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.suporte_logs;
REVOKE INSERT ON public.suporte_logs FROM anon;
