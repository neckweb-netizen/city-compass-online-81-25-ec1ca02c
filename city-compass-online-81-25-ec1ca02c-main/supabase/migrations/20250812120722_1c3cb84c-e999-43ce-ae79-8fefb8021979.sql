
-- Adicionar o novo tipo "servicos" ao enum tipo_categoria
ALTER TYPE tipo_categoria ADD VALUE 'servicos';

-- Inserir algumas categorias padrão para serviços
INSERT INTO public.categorias (nome, slug, tipo, icone_url, ativo) VALUES
('Limpeza', 'limpeza', 'servicos', '🧽', true),
('Eletricista', 'eletricista', 'servicos', '⚡', true),
('Encanador', 'encanador', 'servicos', '🔧', true),
('Jardinagem', 'jardinagem', 'servicos', '🌱', true),
('Pintura', 'pintura', 'servicos', '🎨', true),
('Marcenaria', 'marcenaria', 'servicos', '🪚', true),
('Mecânico', 'mecanico', 'servicos', '🔧', true),
('Beleza e Estética', 'beleza-estetica', 'servicos', '💄', true),
('Consultoria', 'consultoria', 'servicos', '📊', true),
('Tecnologia', 'tecnologia', 'servicos', '💻', true);
