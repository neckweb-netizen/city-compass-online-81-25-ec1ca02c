
-- Adicionar campos para botões personalizados nos stories
ALTER TABLE empresa_stories 
ADD COLUMN botao_titulo TEXT DEFAULT 'Ver Perfil da Empresa',
ADD COLUMN botao_link TEXT,
ADD COLUMN botao_tipo TEXT DEFAULT 'empresa' CHECK (botao_tipo IN ('empresa', 'personalizado'));

-- Comentários para documentar os novos campos
COMMENT ON COLUMN empresa_stories.botao_titulo IS 'Título personalizado do botão do story';
COMMENT ON COLUMN empresa_stories.botao_link IS 'Link personalizado para o botão (usado quando botao_tipo = personalizado)';
COMMENT ON COLUMN empresa_stories.botao_tipo IS 'Tipo do botão: empresa (link para perfil) ou personalizado (link customizado)';
