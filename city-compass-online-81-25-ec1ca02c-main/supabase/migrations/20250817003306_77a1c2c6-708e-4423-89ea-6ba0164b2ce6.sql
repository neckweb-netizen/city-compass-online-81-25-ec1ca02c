-- Função para atualizar tipo de conta do usuário quando empresa é aprovada
CREATE OR REPLACE FUNCTION public.atualizar_tipo_conta_usuario_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Só atualiza se o status mudou para aprovado e há um proprietário
    IF NEW.status_aprovacao = 'aprovado' AND OLD.status_aprovacao != 'aprovado' AND NEW.usuario_id IS NOT NULL THEN
        -- Atualizar tipo de conta do usuário para 'empresa'
        UPDATE public.usuarios 
        SET tipo_conta = 'empresa'
        WHERE id = NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger para executar a função quando empresa for aprovada
CREATE TRIGGER trigger_atualizar_tipo_conta_usuario_empresa
    AFTER UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.atualizar_tipo_conta_usuario_empresa();