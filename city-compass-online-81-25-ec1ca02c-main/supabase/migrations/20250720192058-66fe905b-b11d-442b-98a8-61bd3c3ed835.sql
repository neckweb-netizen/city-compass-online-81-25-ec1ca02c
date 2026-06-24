
-- Adicionar coluna secao à tabela banners_publicitarios
ALTER TABLE public.banners_publicitarios 
ADD COLUMN secao text NOT NULL DEFAULT 'home';

-- Remover a coluna cidade_id se ela existir
ALTER TABLE public.banners_publicitarios 
DROP COLUMN IF EXISTS cidade_id;

-- Criar um tipo enum para as seções disponíveis
CREATE TYPE tipo_secao_banner AS ENUM ('home', 'empresas', 'eventos', 'categorias', 'busca');

-- Alterar a coluna secao para usar o enum
ALTER TABLE public.banners_publicitarios 
ALTER COLUMN secao TYPE tipo_secao_banner USING secao::tipo_secao_banner;

-- Atualizar a constraint de ordem para ser por seção
DROP INDEX IF EXISTS idx_banners_ordem;
CREATE UNIQUE INDEX idx_banners_secao_ordem ON public.banners_publicitarios (secao, ordem) WHERE ativo = true;
