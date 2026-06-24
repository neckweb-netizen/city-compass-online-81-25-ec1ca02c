
-- Adicionar enum para status de aprovação das empresas
DO $$ BEGIN
    CREATE TYPE status_aprovacao AS ENUM ('pendente', 'aprovado', 'rejeitado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna de status de aprovação na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS status_aprovacao status_aprovacao DEFAULT 'pendente';

-- Adicionar campos para controle de aprovação
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone,
ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES public.usuarios(id),
ADD COLUMN IF NOT EXISTS observacoes_admin text;

-- Atualizar empresas existentes para status aprovado (para não quebrar funcionalidade atual)
UPDATE public.empresas 
SET status_aprovacao = 'aprovado', data_aprovacao = now()
WHERE status_aprovacao = 'pendente' AND ativo = true;

-- Atualizar política de visualização para incluir empresas aprovadas
DROP POLICY IF EXISTS "Todos podem ver empresas ativas" ON public.empresas;
CREATE POLICY "Todos podem ver empresas aprovadas" 
ON public.empresas 
FOR SELECT 
USING (ativo = true AND status_aprovacao = 'aprovado');

-- Política para admins verem todas as empresas
CREATE POLICY "Admins podem ver todas as empresas" 
ON public.empresas 
FOR SELECT 
USING (user_has_permission(usuario_id, cidade_id));

-- Atualizar trigger para manter funcionalidade de estatísticas
CREATE OR REPLACE FUNCTION public.atualizar_status_empresa_aprovacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se empresa foi aprovada, ativar automaticamente
    IF NEW.status_aprovacao = 'aprovado' AND OLD.status_aprovacao != 'aprovado' THEN
        NEW.ativo = true;
        NEW.data_aprovacao = now();
    END IF;
    
    -- Se empresa foi rejeitada, desativar
    IF NEW.status_aprovacao = 'rejeitado' THEN
        NEW.ativo = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_empresa_aprovacao
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.atualizar_status_empresa_aprovacao();
