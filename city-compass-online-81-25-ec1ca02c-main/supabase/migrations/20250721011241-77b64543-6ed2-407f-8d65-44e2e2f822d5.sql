-- Create table for user-company admin assignments
CREATE TABLE public.usuario_empresa_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  atribuido_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(usuario_id, empresa_id)
);

-- Enable RLS
ALTER TABLE public.usuario_empresa_admin ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin geral pode gerenciar atribuições de empresa" 
ON public.usuario_empresa_admin 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo_conta = 'admin_geral'
  )
);

CREATE POLICY "Admin cidade pode ver atribuições de sua cidade" 
ON public.usuario_empresa_admin 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.empresas e ON e.id = usuario_empresa_admin.empresa_id
    WHERE u.id = auth.uid() 
    AND u.tipo_conta = 'admin_cidade' 
    AND e.cidade_id = u.cidade_id
  )
);

CREATE POLICY "Admins de empresa podem ver suas atribuições" 
ON public.usuario_empresa_admin 
FOR SELECT 
USING (usuario_id = auth.uid() AND ativo = true);

-- Update empresa policies to include assigned admins
DROP POLICY IF EXISTS "Proprietários podem gerenciar suas empresas" ON public.empresas;

CREATE POLICY "Proprietários e admins atribuídos podem gerenciar empresas" 
ON public.empresas 
FOR ALL 
USING (
  usuario_id = auth.uid() 
  OR user_has_permission(usuario_id, cidade_id)
  OR EXISTS (
    SELECT 1 FROM public.usuario_empresa_admin uea 
    WHERE uea.empresa_id = empresas.id 
    AND uea.usuario_id = auth.uid() 
    AND uea.ativo = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_usuario_empresa_admin_updated_at
BEFORE UPDATE ON public.usuario_empresa_admin
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();