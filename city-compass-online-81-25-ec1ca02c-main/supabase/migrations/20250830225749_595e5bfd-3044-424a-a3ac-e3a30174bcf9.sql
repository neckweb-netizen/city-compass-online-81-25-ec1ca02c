-- Adicionar campo tipo_midia aos banners publicitários
ALTER TABLE banners_publicitarios 
ADD COLUMN tipo_midia TEXT DEFAULT 'imagem' CHECK (tipo_midia IN ('imagem', 'video'));