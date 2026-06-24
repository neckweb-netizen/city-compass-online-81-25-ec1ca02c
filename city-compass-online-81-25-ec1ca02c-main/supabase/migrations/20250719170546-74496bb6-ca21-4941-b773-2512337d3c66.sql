
-- Criar tabela para favoritos de usuários
CREATE TABLE public.favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, empresa_id)
);

-- Habilitar RLS para favoritos
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios favoritos
CREATE POLICY "Usuários podem ver seus favoritos" 
  ON public.favoritos 
  FOR SELECT 
  USING (auth.uid() = usuario_id);

-- Política para usuários criarem seus próprios favoritos
CREATE POLICY "Usuários podem criar favoritos" 
  ON public.favoritos 
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Política para usuários removerem seus próprios favoritos
CREATE POLICY "Usuários podem remover favoritos" 
  ON public.favoritos 
  FOR DELETE 
  USING (auth.uid() = usuario_id);

-- Função para verificar se uma empresa está favoritada
CREATE OR REPLACE FUNCTION public.empresa_esta_favoritada(empresa_id_param uuid, usuario_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.favoritos 
    WHERE empresa_id = empresa_id_param 
    AND usuario_id = usuario_id_param
  );
$$;
