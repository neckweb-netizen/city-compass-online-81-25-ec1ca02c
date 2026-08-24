-- Amplia as opções do cadastro de eventos sem duplicar registros em novos deploys.
insert into public.categorias (nome, slug, tipo, ativo)
values
  ('Festas e Baladas', 'eventos-festas-baladas', 'evento', true),
  ('Cultura e Arte', 'eventos-cultura-arte', 'evento', true),
  ('Esportes', 'eventos-esportes', 'evento', true),
  ('Cursos e Workshops', 'eventos-cursos-workshops', 'evento', true),
  ('Feiras e Exposições', 'eventos-feiras-exposicoes', 'evento', true),
  ('Gastronomia', 'eventos-gastronomia', 'evento', true),
  ('Religiosos', 'eventos-religiosos', 'evento', true),
  ('Infantil e Família', 'eventos-infantil-familia', 'evento', true),
  ('Negócios e Networking', 'eventos-negocios-networking', 'evento', true),
  ('Saúde e Bem-estar', 'eventos-saude-bem-estar', 'evento', true),
  ('Comunitários', 'eventos-comunitarios', 'evento', true),
  ('Tecnologia e Inovação', 'eventos-tecnologia-inovacao', 'evento', true),
  ('Beneficentes', 'eventos-beneficentes', 'evento', true),
  ('Turismo e Passeios', 'eventos-turismo-passeios', 'evento', true),
  ('Festas Populares', 'eventos-festas-populares', 'evento', true)
on conflict (slug) do update
set nome = excluded.nome,
    tipo = excluded.tipo,
    ativo = true;
