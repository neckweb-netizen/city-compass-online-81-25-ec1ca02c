
-- Adicionar campo status_aprovacao na tabela eventos
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS status_aprovacao status_aprovacao DEFAULT 'pendente';

-- Atualizar eventos existentes para 'aprovado' se já estão ativos
UPDATE public.eventos 
SET status_aprovacao = 'aprovado' 
WHERE ativo = true AND status_aprovacao IS NULL;

-- Adicionar campo aprovado_por para rastrear quem aprovou
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES public.usuarios(id);

-- Adicionar campo data_aprovacao
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone;

-- Criar trigger para aprovação automática de eventos criados por admins
CREATE OR REPLACE FUNCTION public.auto_aprovar_evento_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_type tipo_conta;
BEGIN
    -- Buscar tipo de conta do usuário criador
    SELECT tipo_conta INTO user_type
    FROM public.usuarios 
    WHERE id = auth.uid();
    
    -- Se for admin, aprovar automaticamente
    IF user_type IN ('admin_geral', 'admin_cidade') THEN
        NEW.status_aprovacao = 'aprovado';
        NEW.aprovado_por = auth.uid();
        NEW.data_aprovacao = now();
        NEW.ativo = true;
    ELSE
        -- Usuário comum - manter pendente
        NEW.status_aprovacao = 'pendente';
        NEW.ativo = false;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_aprovar_evento_admin ON public.eventos;
CREATE TRIGGER trigger_auto_aprovar_evento_admin
    BEFORE INSERT ON public.eventos
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_aprovar_evento_admin();

-- Atualizar política RLS para permitir que usuários autenticados criem eventos
DROP POLICY IF EXISTS "Empresas podem gerenciar seus eventos" ON public.eventos;
DROP POLICY IF EXISTS "Usuários podem criar eventos" ON public.eventos;

-- Nova política para criação - qualquer usuário autenticado pode criar
CREATE POLICY "Usuários autenticados podem criar eventos" 
ON public.eventos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para visualização - todos podem ver eventos aprovados e ativos
CREATE POLICY "Todos podem ver eventos aprovados" 
ON public.eventos 
FOR SELECT 
USING (ativo = true AND status_aprovacao = 'aprovado');

-- Política para que usuários vejam seus próprios eventos (mesmo pendentes)
CREATE POLICY "Usuários podem ver seus próprios eventos" 
ON public.eventos 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND (
            tipo_conta IN ('admin_geral', 'admin_cidade') 
            OR eventos.empresa_id IN (
                SELECT emp.id FROM public.empresas emp 
                WHERE emp.usuario_id = auth.uid()
            )
        )
    )
);

-- Política para que empresas possam atualizar seus eventos (mas não o status de aprovação)
CREATE POLICY "Empresas podem atualizar seus eventos" 
ON public.eventos 
FOR UPDATE 
USING (
    empresa_id IN (
        SELECT id FROM public.empresas 
        WHERE usuario_id = auth.uid()
    )
)
WITH CHECK (
    empresa_id IN (
        SELECT id FROM public.empresas 
        WHERE usuario_id = auth.uid()
    )
);

-- Política para admins gerenciarem todos os eventos
CREATE POLICY "Admins podem gerenciar todos os eventos" 
ON public.eventos 
FOR ALL 
USING (user_has_permission(NULL::uuid, cidade_id));
