-- Função para notificar proprietário sobre mudança de status da empresa
CREATE OR REPLACE FUNCTION public.notificar_status_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Só notifica se o status mudou e há um proprietário
    IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao AND NEW.usuario_id IS NOT NULL THEN
        
        -- Notificação para aprovação
        IF NEW.status_aprovacao = 'aprovado' THEN
            INSERT INTO public.notificacoes (
                usuario_id,
                titulo,
                conteudo,
                tipo,
                referencia_tipo,
                referencia_id
            ) VALUES (
                NEW.usuario_id,
                'Empresa aprovada!',
                'Parabéns! Sua empresa "' || NEW.nome || '" foi aprovada e já está visível no guia. Agora você pode adicionar produtos, cupons e eventos.',
                'aprovacao',
                'empresa',
                NEW.id::text
            );
            
        -- Notificação para rejeição
        ELSIF NEW.status_aprovacao = 'rejeitado' THEN
            INSERT INTO public.notificacoes (
                usuario_id,
                titulo,
                conteudo,
                tipo,
                referencia_tipo,
                referencia_id
            ) VALUES (
                NEW.usuario_id,
                'Empresa rejeitada',
                'Sua empresa "' || NEW.nome || '" foi rejeitada. ' || 
                CASE 
                    WHEN NEW.observacoes_admin IS NOT NULL AND NEW.observacoes_admin != '' 
                    THEN 'Motivo: ' || NEW.observacoes_admin || ' Entre em contato para mais informações.'
                    ELSE 'Entre em contato com o administrador para mais informações.'
                END,
                'rejeicao',
                'empresa',
                NEW.id::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para executar a função após atualizações na tabela empresas
DROP TRIGGER IF EXISTS trigger_notificar_status_empresa ON public.empresas;
CREATE TRIGGER trigger_notificar_status_empresa
    AFTER UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.notificar_status_empresa();