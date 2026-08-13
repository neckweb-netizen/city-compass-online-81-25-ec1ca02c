-- Permite que as seções públicas da página inicial consultem apenas os dados
-- já filtrados pelas funções de destaque e enquete ativa.
GRANT EXECUTE ON FUNCTION public.buscar_empresas_destaque(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_enquete_ativa() TO anon, authenticated;
