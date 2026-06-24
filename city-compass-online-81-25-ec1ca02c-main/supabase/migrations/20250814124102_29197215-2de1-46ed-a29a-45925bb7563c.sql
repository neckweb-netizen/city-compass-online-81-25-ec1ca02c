-- Modificar tabela empresa_stories para suportar stories do sistema
ALTER TABLE public.empresa_stories 
ADD COLUMN tipo_story text NOT NULL DEFAULT 'empresa',
ADD COLUMN nome_perfil_sistema text,
ADD COLUMN tipo_midia text NOT NULL DEFAULT 'imagem',
ADD COLUMN url_midia text;

-- Permitir empresa_id nulo para stories do sistema
ALTER TABLE public.empresa_stories 
ALTER COLUMN empresa_id DROP NOT NULL;

-- Adicionar constraint para garantir consistência
ALTER TABLE public.empresa_stories 
ADD CONSTRAINT check_story_type_consistency 
CHECK (
  (tipo_story = 'empresa' AND empresa_id IS NOT NULL AND nome_perfil_sistema IS NULL) OR
  (tipo_story = 'sistema' AND empresa_id IS NULL AND nome_perfil_sistema IS NOT NULL)
);

-- Atualizar url_midia como imagem_story_url para stories existentes
UPDATE public.empresa_stories 
SET url_midia = imagem_story_url 
WHERE url_midia IS NULL;

-- Comentário para documentar as mudanças
COMMENT ON COLUMN public.empresa_stories.tipo_story IS 'Tipo do story: empresa (vinculado a empresa) ou sistema (perfil personalizado do admin)';
COMMENT ON COLUMN public.empresa_stories.nome_perfil_sistema IS 'Nome do perfil para stories do sistema (obrigatório quando tipo_story = sistema)';
COMMENT ON COLUMN public.empresa_stories.tipo_midia IS 'Tipo de mídia: imagem ou video';
COMMENT ON COLUMN public.empresa_stories.url_midia IS 'URL da mídia (imagem ou vídeo) do story';