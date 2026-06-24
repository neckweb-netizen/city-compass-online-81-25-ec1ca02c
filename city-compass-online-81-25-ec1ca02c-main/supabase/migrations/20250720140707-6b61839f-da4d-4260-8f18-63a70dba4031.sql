
-- Remover a constraint UNIQUE que limita um story por empresa
ALTER TABLE public.empresa_stories DROP CONSTRAINT IF EXISTS empresa_stories_empresa_id_key;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_empresa_stories_empresa_ativo ON public.empresa_stories(empresa_id, ativo);
