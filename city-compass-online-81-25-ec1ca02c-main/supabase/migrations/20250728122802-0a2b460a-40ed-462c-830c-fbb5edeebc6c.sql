-- Criar categoria Rádios
INSERT INTO public.categorias (nome, slug, tipo, ativo) 
VALUES ('Rádios', 'radios', 'empresa', true)
ON CONFLICT (slug) DO NOTHING;