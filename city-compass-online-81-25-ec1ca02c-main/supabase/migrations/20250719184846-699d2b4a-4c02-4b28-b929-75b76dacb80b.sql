-- Phase 1: Database Security Hardening
-- Create audit log table for user role changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.usuarios(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit logs (only admins can view)
CREATE POLICY "Admins podem ver logs de auditoria" 
ON public.audit_logs 
FOR SELECT 
USING (user_has_permission());

-- Create secure function to get current user role (fixes privilege escalation)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT tipo_conta FROM public.usuarios WHERE id = auth.uid();
$$;

-- Create secure function to check if user can assign role
CREATE OR REPLACE FUNCTION public.can_assign_role(target_role tipo_conta)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT CASE 
        WHEN public.get_current_user_role() = 'admin_geral' THEN true
        WHEN public.get_current_user_role() = 'admin_cidade' AND target_role IN ('usuario', 'empresa') THEN true
        ELSE false
    END;
$$;

-- Create audit trigger function for user role changes
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only log tipo_conta changes
    IF OLD.tipo_conta IS DISTINCT FROM NEW.tipo_conta THEN
        -- Check if current user can assign this role
        IF NOT public.can_assign_role(NEW.tipo_conta) THEN
            RAISE EXCEPTION 'Acesso negado: Você não tem permissão para atribuir este tipo de conta';
        END IF;
        
        INSERT INTO public.audit_logs (
            table_name,
            record_id,
            action,
            old_values,
            new_values,
            changed_by
        ) VALUES (
            'usuarios',
            NEW.id,
            'UPDATE_ROLE',
            jsonb_build_object('tipo_conta', OLD.tipo_conta),
            jsonb_build_object('tipo_conta', NEW.tipo_conta),
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for audit logging on usuarios table
DROP TRIGGER IF EXISTS trigger_audit_user_role_changes ON public.usuarios;
CREATE TRIGGER trigger_audit_user_role_changes
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_user_role_changes();

-- Fix search path issues in existing security definer functions
CREATE OR REPLACE FUNCTION public.user_has_permission(target_user_id uuid DEFAULT NULL::uuid, target_cidade_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_type tipo_conta;
    current_user_cidade UUID;
BEGIN
    SELECT tipo_conta, cidade_id INTO current_user_type, current_user_cidade
    FROM public.usuarios WHERE id = auth.uid();
    
    -- Admin geral tem acesso a tudo
    IF current_user_type = 'admin_geral' THEN
        RETURN true;
    END IF;
    
    -- Admin cidade só acessa sua cidade
    IF current_user_type = 'admin_cidade' THEN
        RETURN target_cidade_id = current_user_cidade OR target_cidade_id IS NULL;
    END IF;
    
    -- Usuário comum e empresa só acessam próprios dados
    RETURN target_user_id = auth.uid() OR target_user_id IS NULL;
END;
$$;

-- Update other security definer functions with proper search path
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_empresa(empresa_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.estatisticas (empresa_id, total_avaliacoes, media_avaliacoes)
    VALUES (
        empresa_id_param,
        (SELECT COUNT(*) FROM public.avaliacoes WHERE empresa_id = empresa_id_param),
        (SELECT COALESCE(AVG(nota), 0) FROM public.avaliacoes WHERE empresa_id = empresa_id_param)
    )
    ON CONFLICT (empresa_id) DO UPDATE SET
        total_avaliacoes = EXCLUDED.total_avaliacoes,
        media_avaliacoes = EXCLUDED.media_avaliacoes,
        atualizado_em = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuarios (id, nome, email, tipo_conta)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'usuario'
    );
    RETURN NEW;
END;
$$;