-- Habilitar RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de produtos ativos
CREATE POLICY "Produtos ativos são visíveis para todos" 
ON public.produtos 
FOR SELECT 
USING (ativo = true);

-- Política para permitir inserção por empresas autenticadas
CREATE POLICY "Empresas podem criar seus próprios produtos" 
ON public.produtos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.empresas e 
    WHERE e.id = empresa_id 
    AND e.usuario_id = auth.uid()
  )
);

-- Política para permitir atualização por empresas proprietárias
CREATE POLICY "Empresas podem atualizar seus próprios produtos" 
ON public.produtos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e 
    WHERE e.id = empresa_id 
    AND e.usuario_id = auth.uid()
  )
);

-- Política para permitir exclusão por empresas proprietárias
CREATE POLICY "Empresas podem excluir seus próprios produtos" 
ON public.produtos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e 
    WHERE e.id = empresa_id 
    AND e.usuario_id = auth.uid()
  )
);