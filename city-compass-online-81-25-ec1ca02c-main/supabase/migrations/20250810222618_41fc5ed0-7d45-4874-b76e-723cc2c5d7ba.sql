-- Fix audit_logs RLS policy security issue
-- The current policy allows all users to access audit logs because user_has_permission() 
-- returns true for NULL parameters. We need to restrict access to admin users only.

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins podem ver logs de auditoria" ON public.audit_logs;

-- Create a new, more secure policy that only allows admin users
CREATE POLICY "Apenas admins podem acessar logs de auditoria" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Also ensure that only admin users can INSERT audit logs (system should handle this)
CREATE POLICY "Apenas sistema pode inserir logs de auditoria" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Prevent any updates or deletes on audit logs for data integrity
CREATE POLICY "Audit logs são somente leitura" 
ON public.audit_logs 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Audit logs não podem ser excluídos" 
ON public.audit_logs 
FOR DELETE 
TO authenticated
USING (false);