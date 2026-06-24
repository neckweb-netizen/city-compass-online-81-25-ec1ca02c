-- Permitir que empresas não tenham proprietário definido (criadas por admin)
ALTER TABLE public.empresas 
ALTER COLUMN usuario_id DROP NOT NULL;