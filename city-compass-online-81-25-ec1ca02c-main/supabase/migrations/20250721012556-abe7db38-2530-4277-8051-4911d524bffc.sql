-- Fix the recursive RLS policy issue on empresas table
DROP POLICY IF EXISTS "Proprietários e admins atribuídos podem gerenciar empresas" ON public.empresas;

-- Create a non-recursive policy for empresas
CREATE POLICY "Proprietários e admins atribuídos podem gerenciar empresas" 
ON public.empresas 
FOR ALL 
USING (
  usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND (
      tipo_conta = 'admin_geral'
      OR (tipo_conta = 'admin_cidade' AND cidade_id = empresas.cidade_id)
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.usuario_empresa_admin uea 
    WHERE uea.empresa_id = empresas.id 
    AND uea.usuario_id = auth.uid() 
    AND uea.ativo = true
  )
);