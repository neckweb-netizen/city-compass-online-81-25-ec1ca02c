
-- Criar a função RPC buscar_empresas_destaque se não existir
CREATE OR REPLACE FUNCTION public.buscar_empresas_destaque(
  cidade_id_param UUID DEFAULT NULL,
  limite INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  categoria_nome TEXT,
  endereco TEXT,
  imagem_capa_url TEXT,
  verificado BOOLEAN,
  media_avaliacoes NUMERIC,
  total_avaliacoes INTEGER,
  prioridade_destaque INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    c.nome as categoria_nome,
    e.endereco,
    e.imagem_capa_url,
    e.verificado,
    COALESCE(est.media_avaliacoes, 0) as media_avaliacoes,
    COALESCE(est.total_avaliacoes, 0) as total_avaliacoes,
    CASE 
      WHEN e.destaque = true THEN 1
      ELSE 0
    END as prioridade_destaque
  FROM empresas e
  LEFT JOIN categorias c ON e.categoria_id = c.id
  LEFT JOIN estatisticas est ON e.id = est.empresa_id
  WHERE 
    e.ativo = true
    AND (cidade_id_param IS NULL OR e.cidade_id = cidade_id_param)
    AND e.destaque = true
  ORDER BY 
    e.destaque DESC,
    COALESCE(est.media_avaliacoes, 0) DESC,
    e.criado_em DESC
  LIMIT limite;
END;
$$;

-- Conceder permissões para usuários autenticados e anônimos
GRANT EXECUTE ON FUNCTION public.buscar_empresas_destaque TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_empresas_destaque TO anon;
