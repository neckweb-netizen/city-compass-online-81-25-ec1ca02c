-- Adicionar nova seção de produtos em destaque
INSERT INTO public.home_sections_order (
  section_name,
  display_name,
  ordem,
  ativo
) VALUES (
  'featured_products',
  'Produtos em Destaque',
  12,
  true
);