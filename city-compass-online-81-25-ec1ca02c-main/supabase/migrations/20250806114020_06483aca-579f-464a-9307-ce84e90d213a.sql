-- Adicionar campos faltantes na tabela planos
ALTER TABLE public.planos 
ADD COLUMN IF NOT EXISTS limite_produtos integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS produtos_destaque_permitidos integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS suporte_prioritario boolean NOT NULL DEFAULT false;

-- Atualizar campos existentes se necessário
UPDATE public.planos 
SET limite_produtos = 10, produtos_destaque_permitidos = 3, suporte_prioritario = true
WHERE nome = 'Premium' OR preco_mensal > 50;

UPDATE public.planos 
SET limite_produtos = 5, produtos_destaque_permitidos = 1, suporte_prioritario = false
WHERE nome = 'Básico' OR (preco_mensal > 0 AND preco_mensal <= 50);

UPDATE public.planos 
SET limite_produtos = 2, produtos_destaque_permitidos = 0, suporte_prioritario = false
WHERE preco_mensal = 0;