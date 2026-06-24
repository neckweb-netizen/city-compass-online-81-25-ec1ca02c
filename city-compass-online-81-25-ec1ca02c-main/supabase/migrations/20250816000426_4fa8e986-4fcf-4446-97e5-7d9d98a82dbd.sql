-- Adicionar campo imagem_capa_url à tabela empresa_stories
ALTER TABLE public.empresa_stories 
ADD COLUMN imagem_capa_url text;