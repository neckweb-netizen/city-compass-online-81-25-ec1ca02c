-- Fix all RLS recursion issues by removing ALL circular references
-- First, drop ALL policies for both tables to start fresh

DROP POLICY IF EXISTS "Proprietários e admins atribuídos podem gerenciar empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem ver todas as empresas" ON public.empresas;
DROP POLICY IF EXISTS "Todos podem ver empresas aprovadas" ON public.empresas;

DROP POLICY IF EXISTS "Admin geral pode gerenciar atribuições de empresa" ON public.usuario_empresa_admin;
DROP POLICY IF EXISTS "Admin cidade pode ver atribuições de sua cidade" ON public.usuario_empresa_admin;
DROP POLICY IF EXISTS "Admins de empresa podem ver suas atribuições" ON public.usuario_empresa_admin;

-- Create completely non-recursive policies for empresas table
CREATE POLICY "Admin geral pode gerenciar todas as empresas" 
ON public.empresas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo_conta = 'admin_geral'
  )
);

CREATE POLICY "Admin cidade pode gerenciar empresas de sua cidade" 
ON public.empresas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta = 'admin_cidade' 
    AND cidade_id = empresas.cidade_id
  )
);

CREATE POLICY "Proprietários podem gerenciar suas empresas" 
ON public.empresas 
FOR ALL 
USING (usuario_id = auth.uid());

CREATE POLICY "Todos podem ver empresas aprovadas" 
ON public.empresas 
FOR SELECT 
USING (ativo = true AND status_aprovacao = 'aprovado');

-- Create non-recursive policies for usuario_empresa_admin table
CREATE POLICY "Admin geral pode gerenciar todas as atribuições" 
ON public.usuario_empresa_admin 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo_conta = 'admin_geral'
  )
);

CREATE POLICY "Usuários podem ver suas próprias atribuições" 
ON public.usuario_empresa_admin 
FOR SELECT 
USING (usuario_id = auth.uid() AND ativo = true);