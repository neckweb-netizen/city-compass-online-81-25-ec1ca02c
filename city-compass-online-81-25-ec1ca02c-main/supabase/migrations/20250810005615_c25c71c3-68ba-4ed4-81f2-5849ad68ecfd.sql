-- Remover campo galeria_urls da tabela empresas
ALTER TABLE public.empresas DROP COLUMN IF EXISTS galeria_urls;