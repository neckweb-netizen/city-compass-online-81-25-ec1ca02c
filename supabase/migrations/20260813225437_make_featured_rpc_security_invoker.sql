-- A consulta de empresas em destaque respeita as políticas públicas de leitura
-- das tabelas empresas, categorias e estatisticas.
ALTER FUNCTION public.buscar_empresas_destaque(uuid, integer) SECURITY INVOKER;
