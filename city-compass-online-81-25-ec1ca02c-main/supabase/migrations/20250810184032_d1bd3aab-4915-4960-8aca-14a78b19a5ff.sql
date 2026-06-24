-- Corrigir função buscar_enquete_ativa com erro de aggregate functions
CREATE OR REPLACE FUNCTION public.buscar_enquete_ativa()
 RETURNS TABLE(
   id uuid, 
   titulo text, 
   descricao text, 
   opcoes jsonb, 
   multipla_escolha boolean, 
   total_votos bigint, 
   resultados jsonb
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH enquete_ativa AS (
    SELECT 
      e.id,
      e.titulo,
      e.descricao,
      e.opcoes,
      e.multipla_escolha
    FROM public.enquetes e
    WHERE e.ativo = true
      AND e.data_inicio <= now()
      AND (e.data_fim IS NULL OR e.data_fim >= now())
    ORDER BY e.criado_em DESC
    LIMIT 1
  ),
  votos_contados AS (
    SELECT 
      r.enquete_id,
      r.opcao_indice,
      COUNT(*) as count
    FROM public.respostas_enquete r
    INNER JOIN enquete_ativa ea ON r.enquete_id = ea.id
    GROUP BY r.enquete_id, r.opcao_indice
  ),
  total_votos_enquete AS (
    SELECT 
      r.enquete_id,
      COUNT(*) as total_count
    FROM public.respostas_enquete r
    INNER JOIN enquete_ativa ea ON r.enquete_id = ea.id
    GROUP BY r.enquete_id
  )
  SELECT 
    ea.id,
    ea.titulo,
    ea.descricao,
    ea.opcoes,
    ea.multipla_escolha,
    COALESCE(tv.total_count, 0) as total_votos,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'opcao_indice', vc.opcao_indice,
            'count', vc.count
          )
        )
        FROM votos_contados vc 
        WHERE vc.enquete_id = ea.id
      ),
      '[]'::jsonb
    ) as resultados
  FROM enquete_ativa ea
  LEFT JOIN total_votos_enquete tv ON ea.id = tv.enquete_id;
END;
$function$