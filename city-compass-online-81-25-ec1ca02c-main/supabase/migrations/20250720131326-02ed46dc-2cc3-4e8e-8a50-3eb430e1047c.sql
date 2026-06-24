
-- Criar tabela para controlar stories das empresas
CREATE TABLE public.empresa_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  imagem_story_url TEXT NOT NULL,
  duracao INTEGER NOT NULL DEFAULT 15 CHECK (duracao > 0 AND duracao <= 15),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Habilitar RLS
ALTER TABLE public.empresa_stories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver stories ativos" 
  ON public.empresa_stories 
  FOR SELECT 
  USING (ativo = true);

CREATE POLICY "Admins podem gerenciar stories" 
  ON public.empresa_stories 
  FOR ALL 
  USING (user_has_permission());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empresa_stories_updated_at
  BEFORE UPDATE ON public.empresa_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_empresa_stories_ativo_ordem ON public.empresa_stories(ativo, ordem);
CREATE INDEX idx_empresa_stories_empresa_id ON public.empresa_stories(empresa_id);
