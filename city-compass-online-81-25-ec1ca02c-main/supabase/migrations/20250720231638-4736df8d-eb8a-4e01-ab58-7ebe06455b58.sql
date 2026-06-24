-- Step 1: Add secao column as text first
ALTER TABLE public.banners_publicitarios 
ADD COLUMN IF NOT EXISTS secao text NOT NULL DEFAULT 'home';

-- Step 2: Remove cidade_id if it exists
ALTER TABLE public.banners_publicitarios 
DROP COLUMN IF EXISTS cidade_id;

-- Step 3: Create enum type
DO $$ BEGIN
    CREATE TYPE tipo_secao_banner AS ENUM ('home', 'empresas', 'eventos', 'categorias', 'busca');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Convert column to enum type
ALTER TABLE public.banners_publicitarios 
ALTER COLUMN secao DROP DEFAULT,
ALTER COLUMN secao TYPE tipo_secao_banner USING secao::tipo_secao_banner,
ALTER COLUMN secao SET DEFAULT 'home'::tipo_secao_banner;

-- Step 5: Create unique index for order per section
DROP INDEX IF EXISTS idx_banners_ordem;
CREATE UNIQUE INDEX idx_banners_secao_ordem ON public.banners_publicitarios (secao, ordem) WHERE ativo = true;