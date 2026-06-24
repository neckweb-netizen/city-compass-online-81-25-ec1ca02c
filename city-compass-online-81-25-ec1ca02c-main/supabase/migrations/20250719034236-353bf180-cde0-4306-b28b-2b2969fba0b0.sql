
-- Criar tabela para banners publicitários
CREATE TABLE public.banners_publicitarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  link_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 1 CHECK (ordem >= 1 AND ordem <= 3),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS
ALTER TABLE public.banners_publicitarios ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem banners
CREATE POLICY "Admins podem gerenciar banners publicitários" 
  ON public.banners_publicitarios 
  FOR ALL 
  USING (user_has_permission());

-- Política para todos verem banners ativos
CREATE POLICY "Todos podem ver banners ativos" 
  ON public.banners_publicitarios 
  FOR SELECT 
  USING (ativo = true);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_banners_publicitarios_updated_at 
  BEFORE UPDATE ON public.banners_publicitarios 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índice para melhor performance
CREATE INDEX idx_banners_publicitarios_ativo_ordem ON public.banners_publicitarios(ativo, ordem);
