-- Adicionar foreign key entre produtos e empresas
ALTER TABLE public.produtos 
ADD CONSTRAINT fk_produtos_empresa_id 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;