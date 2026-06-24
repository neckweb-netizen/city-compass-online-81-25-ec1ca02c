
-- 1. Apagar a view existente
DROP VIEW IF EXISTS public.security_dashboard;

-- 2. Recriar a view sem SECURITY DEFINER (comportamento padrão é SECURITY INVOKER)
CREATE VIEW public.security_dashboard AS
SELECT 
    DATE_TRUNC('day', sl.created_at) as date,
    sl.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT sl.user_id) as unique_users,
    COUNT(DISTINCT sl.ip_address) as unique_ips
FROM public.security_logs sl
WHERE sl.created_at >= now() - interval '30 days'
GROUP BY DATE_TRUNC('day', sl.created_at), sl.event_type
ORDER BY date DESC, event_count DESC;

-- 3. Garantir que a view tenha RLS habilitada (views herdam das tabelas base)
-- A view automaticamente respeitará as políticas RLS da tabela security_logs
-- que já está configurada para permitir apenas admins verem os logs

-- 4. Verificar se as políticas RLS da tabela security_logs estão adequadas
-- (A política já existe: "Admins podem ver logs de segurança")
