CREATE OR REPLACE FUNCTION public.incrementar_visualizacao_empresa(p_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_total integer;
BEGIN
  INSERT INTO public.estatisticas (
    empresa_id, total_visualizacoes, total_curtidas,
    total_avaliacoes, media_avaliacoes, atualizado_em
  )
  VALUES (p_empresa_id, 1, 0, 0, 0, now())
  ON CONFLICT (empresa_id) DO UPDATE
    SET total_visualizacoes = coalesce(estatisticas.total_visualizacoes, 0) + 1,
        atualizado_em = now()
  RETURNING total_visualizacoes INTO new_total;
  RETURN new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.incrementar_visualizacao_empresa(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.incrementar_visualizacao_empresa(uuid) TO service_role;
