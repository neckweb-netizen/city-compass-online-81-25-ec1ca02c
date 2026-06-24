-- Sistema de Fórum para Problemas da Cidade (CORRIGIDO)

-- Criar enum para status de problema
CREATE TYPE status_problema AS ENUM ('aberto', 'em_analise', 'resolvido', 'fechado');

-- Criar enum para prioridade
CREATE TYPE prioridade_problema AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Tabela de categorias de problemas
CREATE TABLE public.categorias_problema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela principal de problemas da cidade
CREATE TABLE public.problemas_cidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias_problema(id),
  cidade_id UUID REFERENCES public.cidades(id) NOT NULL,
  bairro TEXT,
  endereco TEXT NOT NULL,
  localizacao POINT,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  status STATUS_PROBLEMA NOT NULL DEFAULT 'aberto',
  prioridade PRIORIDADE_PROBLEMA NOT NULL DEFAULT 'media',
  imagens TEXT[] DEFAULT ARRAY[]::TEXT[],
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  votos_positivos INTEGER NOT NULL DEFAULT 0,
  votos_negativos INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  moderado BOOLEAN NOT NULL DEFAULT false,
  moderado_por UUID REFERENCES auth.users(id),
  data_moderacao TIMESTAMP WITH TIME ZONE,
  observacoes_moderacao TEXT,
  resolvido_em TIMESTAMP WITH TIME ZONE,
  resolvido_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comentários
CREATE TABLE public.comentarios_problema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problema_id UUID REFERENCES public.problemas_cidade(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  comentario_pai_id UUID REFERENCES public.comentarios_problema(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  imagens TEXT[] DEFAULT ARRAY[]::TEXT[],
  votos_positivos INTEGER NOT NULL DEFAULT 0,
  votos_negativos INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  moderado BOOLEAN NOT NULL DEFAULT false,
  moderado_por UUID REFERENCES auth.users(id),
  data_moderacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de votos em problemas
CREATE TABLE public.votos_problema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problema_id UUID REFERENCES public.problemas_cidade(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo_voto INTEGER NOT NULL CHECK (tipo_voto IN (-1, 1)),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(problema_id, usuario_id)
);

-- Tabela de votos em comentários
CREATE TABLE public.votos_comentario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID REFERENCES public.comentarios_problema(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo_voto INTEGER NOT NULL CHECK (tipo_voto IN (-1, 1)),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comentario_id, usuario_id)
);

-- Tabela de seguidores de problemas
CREATE TABLE public.seguidores_problema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problema_id UUID REFERENCES public.problemas_cidade(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(problema_id, usuario_id)
);

-- Enable RLS
ALTER TABLE public.categorias_problema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problemas_cidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_problema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_problema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguidores_problema ENABLE ROW LEVEL SECURITY;

-- RLS Policies para categorias_problema
CREATE POLICY "Todos podem ver categorias ativas"
ON public.categorias_problema FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar categorias"
ON public.categorias_problema FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- RLS Policies para problemas_cidade
CREATE POLICY "Todos podem ver problemas ativos"
ON public.problemas_cidade FOR SELECT
USING (ativo = true);

CREATE POLICY "Usuários autenticados podem criar problemas"
ON public.problemas_cidade FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem editar seus problemas"
ON public.problemas_cidade FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem moderar problemas"
ON public.problemas_cidade FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- RLS Policies para comentarios_problema
CREATE POLICY "Todos podem ver comentários ativos"
ON public.comentarios_problema FOR SELECT
USING (ativo = true);

CREATE POLICY "Usuários autenticados podem comentar"
ON public.comentarios_problema FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem editar seus comentários"
ON public.comentarios_problema FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir seus comentários"
ON public.comentarios_problema FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Admins podem moderar comentários"
ON public.comentarios_problema FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- RLS Policies para votos_problema
CREATE POLICY "Usuários podem ver todos os votos"
ON public.votos_problema FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem votar"
ON public.votos_problema FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus votos"
ON public.votos_problema FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem remover seus votos"
ON public.votos_problema FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- RLS Policies para votos_comentario
CREATE POLICY "Usuários podem ver votos em comentários"
ON public.votos_comentario FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem votar em comentários"
ON public.votos_comentario FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar votos em comentários"
ON public.votos_comentario FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem remover votos em comentários"
ON public.votos_comentario FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- RLS Policies para seguidores_problema
CREATE POLICY "Usuários podem ver seus seguidores"
ON public.seguidores_problema FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem seguir problemas"
ON public.seguidores_problema FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deixar de seguir"
ON public.seguidores_problema FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_categorias_problema_updated_at
  BEFORE UPDATE ON public.categorias_problema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_problemas_cidade_updated_at
  BEFORE UPDATE ON public.problemas_cidade
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comentarios_problema_updated_at
  BEFORE UPDATE ON public.comentarios_problema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar contadores de votos em problemas
CREATE OR REPLACE FUNCTION atualizar_votos_problema()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo_voto = 1 THEN
      UPDATE problemas_cidade 
      SET votos_positivos = votos_positivos + 1 
      WHERE id = NEW.problema_id;
    ELSE
      UPDATE problemas_cidade 
      SET votos_negativos = votos_negativos + 1 
      WHERE id = NEW.problema_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.tipo_voto != NEW.tipo_voto THEN
      IF NEW.tipo_voto = 1 THEN
        UPDATE problemas_cidade 
        SET votos_positivos = votos_positivos + 1,
            votos_negativos = votos_negativos - 1
        WHERE id = NEW.problema_id;
      ELSE
        UPDATE problemas_cidade 
        SET votos_positivos = votos_positivos - 1,
            votos_negativos = votos_negativos + 1
        WHERE id = NEW.problema_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.tipo_voto = 1 THEN
      UPDATE problemas_cidade 
      SET votos_positivos = votos_positivos - 1 
      WHERE id = OLD.problema_id;
    ELSE
      UPDATE problemas_cidade 
      SET votos_negativos = votos_negativos - 1 
      WHERE id = OLD.problema_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_atualizar_votos_problema
  AFTER INSERT OR UPDATE OR DELETE ON public.votos_problema
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_votos_problema();

-- Função para atualizar contadores de votos em comentários
CREATE OR REPLACE FUNCTION atualizar_votos_comentario()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo_voto = 1 THEN
      UPDATE comentarios_problema 
      SET votos_positivos = votos_positivos + 1 
      WHERE id = NEW.comentario_id;
    ELSE
      UPDATE comentarios_problema 
      SET votos_negativos = votos_negativos + 1 
      WHERE id = NEW.comentario_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.tipo_voto != NEW.tipo_voto THEN
      IF NEW.tipo_voto = 1 THEN
        UPDATE comentarios_problema 
        SET votos_positivos = votos_positivos + 1,
            votos_negativos = votos_negativos - 1
        WHERE id = NEW.comentario_id;
      ELSE
        UPDATE comentarios_problema 
        SET votos_positivos = votos_positivos - 1,
            votos_negativos = votos_negativos + 1
        WHERE id = NEW.comentario_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.tipo_voto = 1 THEN
      UPDATE comentarios_problema 
      SET votos_positivos = votos_positivos - 1 
      WHERE id = OLD.comentario_id;
    ELSE
      UPDATE comentarios_problema 
      SET votos_negativos = votos_negativos - 1 
      WHERE id = OLD.comentario_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_atualizar_votos_comentario
  AFTER INSERT OR UPDATE OR DELETE ON public.votos_comentario
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_votos_comentario();

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION incrementar_visualizacao_problema(problema_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE problemas_cidade 
  SET visualizacoes = visualizacoes + 1 
  WHERE id = problema_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Inserir categorias padrão
INSERT INTO public.categorias_problema (nome, slug, descricao, icone, cor, ordem) VALUES
('Infraestrutura', 'infraestrutura', 'Problemas relacionados a vias, calçadas, pontes, etc.', 'Construction', '#EF4444', 1),
('Iluminação', 'iluminacao', 'Falta ou defeito em iluminação pública', 'Lightbulb', '#F59E0B', 2),
('Limpeza', 'limpeza', 'Lixo, entulho, falta de coleta', 'Trash2', '#10B981', 3),
('Sinalização', 'sinalizacao', 'Placas, semáforos, faixas de pedestres', 'TrafficCone', '#3B82F6', 4),
('Segurança', 'seguranca', 'Questões relacionadas à segurança pública', 'Shield', '#8B5CF6', 5),
('Meio Ambiente', 'meio-ambiente', 'Poluição, árvores, áreas verdes', 'Leaf', '#059669', 6),
('Transporte', 'transporte', 'Ônibus, transporte público, trânsito', 'Bus', '#0EA5E9', 7),
('Outros', 'outros', 'Outros problemas não categorizados', 'MoreHorizontal', '#6B7280', 99);

-- Criar índices para performance
CREATE INDEX idx_problemas_cidade_categoria ON public.problemas_cidade(categoria_id);
CREATE INDEX idx_problemas_cidade_cidade ON public.problemas_cidade(cidade_id);
CREATE INDEX idx_problemas_cidade_usuario ON public.problemas_cidade(usuario_id);
CREATE INDEX idx_problemas_cidade_status ON public.problemas_cidade(status);
CREATE INDEX idx_problemas_cidade_criado ON public.problemas_cidade(criado_em DESC);
CREATE INDEX idx_comentarios_problema_problema ON public.comentarios_problema(problema_id);
CREATE INDEX idx_comentarios_problema_usuario ON public.comentarios_problema(usuario_id);
CREATE INDEX idx_votos_problema_problema ON public.votos_problema(problema_id);
CREATE INDEX idx_votos_problema_usuario ON public.votos_problema(usuario_id);
CREATE INDEX idx_votos_comentario_comentario ON public.votos_comentario(comentario_id);
CREATE INDEX idx_votos_comentario_usuario ON public.votos_comentario(usuario_id);