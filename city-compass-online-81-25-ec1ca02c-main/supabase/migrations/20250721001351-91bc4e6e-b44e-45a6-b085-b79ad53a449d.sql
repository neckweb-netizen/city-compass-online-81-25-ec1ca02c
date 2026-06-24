
-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_original DECIMAL(10,2) NOT NULL,
  preco_promocional DECIMAL(10,2),
  categoria_produto TEXT,
  imagem_principal_url TEXT,
  galeria_imagens TEXT[] DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  estoque_disponivel INTEGER DEFAULT 0,
  codigo_produto TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_produtos_empresa_id ON public.produtos(empresa_id);
CREATE INDEX idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX idx_produtos_destaque ON public.produtos(destaque);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_produto);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_produtos_updated_at
    BEFORE UPDATE ON public.produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos
CREATE POLICY "Todos podem ver produtos ativos"
  ON public.produtos
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "Empresas podem gerenciar seus produtos"
  ON public.produtos
  FOR ALL
  USING (
    empresa_id IN (
      SELECT id FROM public.empresas 
      WHERE usuario_id = auth.uid()
    ) OR user_has_permission()
  );

-- Adicionar constraint para garantir que preço promocional seja menor que original
ALTER TABLE public.produtos 
ADD CONSTRAINT check_preco_promocional 
CHECK (preco_promocional IS NULL OR preco_promocional < preco_original);
