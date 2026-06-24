
-- Add missing columns to the eventos table
ALTER TABLE public.eventos 
ADD COLUMN imagem_url text,
ADD COLUMN gratuito boolean DEFAULT true,
ADD COLUMN destaque boolean DEFAULT false,
ADD COLUMN hora_fim text,
ADD COLUMN limite_participantes integer,
ADD COLUMN participantes_confirmados integer DEFAULT 0,
ADD COLUMN preco numeric(10,2);

-- Update existing records to have default values
UPDATE public.eventos 
SET 
  gratuito = true,
  destaque = false,
  participantes_confirmados = 0
WHERE gratuito IS NULL OR destaque IS NULL OR participantes_confirmados IS NULL;
