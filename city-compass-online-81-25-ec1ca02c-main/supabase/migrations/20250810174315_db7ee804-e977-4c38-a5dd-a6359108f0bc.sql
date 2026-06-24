-- Criar tabela para enquetes
CREATE TABLE public.enquetes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  opcoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  multipla_escolha BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para respostas de enquetes
CREATE TABLE public.respostas_enquete (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enquete_id UUID NOT NULL,
  opcao_indice INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  usuario_id UUID,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar seção de enquetes na home_sections_order
INSERT INTO public.home_sections_order (section_name, display_name, ordem, ativo)
VALUES ('enquetes', 'Enquetes', 2, true);

-- Reordenar outras seções
UPDATE public.home_sections_order 
SET ordem = ordem + 1 
WHERE section_name != 'enquetes' AND ordem >= 2;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_enquetes_updated_at
  BEFORE UPDATE ON public.enquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para enquetes
ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver enquetes ativas" 
  ON public.enquetes 
  FOR SELECT 
  USING (ativo = true AND data_inicio <= now() AND (data_fim IS NULL OR data_fim >= now()));

CREATE POLICY "Admins podem gerenciar enquetes" 
  ON public.enquetes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- RLS Policies para respostas
ALTER TABLE public.respostas_enquete ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem votar em enquetes" 
  ON public.respostas_enquete 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enquetes 
      WHERE id = enquete_id 
      AND ativo = true 
      AND data_inicio <= now() 
      AND (data_fim IS NULL OR data_fim >= now())
    )
  );

CREATE POLICY "Admins podem ver respostas" 
  ON public.respostas_enquete 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Função para buscar enquete ativa
CREATE OR REPLACE FUNCTION public.buscar_enquete_ativa()
RETURNS TABLE(
  id UUID,
  titulo TEXT,
  descricao TEXT,
  opcoes JSONB,
  multipla_escolha BOOLEAN,
  total_votos BIGINT,
  resultados JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.titulo,
    e.descricao,
    e.opcoes,
    e.multipla_escolha,
    COALESCE(COUNT(r.id), 0) as total_votos,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'opcao_indice', r.opcao_indice,
          'count', COUNT(*)
        )
      ) FILTER (WHERE r.opcao_indice IS NOT NULL),
      '[]'::jsonb
    ) as resultados
  FROM public.enquetes e
  LEFT JOIN public.respostas_enquete r ON e.id = r.enquete_id
  WHERE e.ativo = true
    AND e.data_inicio <= now()
    AND (e.data_fim IS NULL OR e.data_fim >= now())
  GROUP BY e.id, e.titulo, e.descricao, e.opcoes, e.multipla_escolha
  ORDER BY e.criado_em DESC
  LIMIT 1;
END;
$$;

-- Função para votar
CREATE OR REPLACE FUNCTION public.votar_enquete(
  enquete_id_param UUID,
  opcoes_indices INTEGER[],
  ip_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  enquete_valida BOOLEAN := false;
  ja_votou BOOLEAN := false;
  opcao_indice INTEGER;
BEGIN
  -- Verificar se enquete existe e está ativa
  SELECT EXISTS(
    SELECT 1 FROM public.enquetes 
    WHERE id = enquete_id_param 
    AND ativo = true 
    AND data_inicio <= now() 
    AND (data_fim IS NULL OR data_fim >= now())
  ) INTO enquete_valida;
  
  IF NOT enquete_valida THEN
    RETURN false;
  END IF;
  
  -- Verificar se já votou (por IP ou usuário)
  SELECT EXISTS(
    SELECT 1 FROM public.respostas_enquete 
    WHERE enquete_id = enquete_id_param 
    AND (
      (auth.uid() IS NOT NULL AND usuario_id = auth.uid()) OR
      (auth.uid() IS NULL AND ip_address = ip_param)
    )
  ) INTO ja_votou;
  
  IF ja_votou THEN
    RETURN false;
  END IF;
  
  -- Inserir votos
  FOREACH opcao_indice IN ARRAY opcoes_indices
  LOOP
    INSERT INTO public.respostas_enquete (
      enquete_id, 
      opcao_indice, 
      ip_address, 
      user_agent, 
      usuario_id
    ) VALUES (
      enquete_id_param, 
      opcao_indice, 
      ip_param, 
      user_agent_param, 
      auth.uid()
    );
  END LOOP;
  
  RETURN true;
END;
$$;