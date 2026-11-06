-- Impede que proprietários e administradores de empresa alterem campos de aprovação,
-- planos e privilégios via Data API, mesmo quando políticas RLS permitem UPDATE.
-- service_role é usado por Edge Functions autenticadas; administradores com MFA
-- podem atualizar registros apenas no escopo da cidade.
CREATE OR REPLACE FUNCTION private.protect_empresa_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  privileged boolean;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  privileged := private.admin_mfa_verified(
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.cidade_id ELSE NEW.cidade_id END,
    false
  );

  IF TG_OP = 'INSERT' THEN
    IF NOT privileged THEN
      IF (SELECT auth.uid()) IS NULL OR NEW.usuario_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Proprietário inválido' USING ERRCODE = '42501';
      END IF;
      NEW.ativo := false;
      NEW.destaque := false;
      NEW.verificado := false;
      NEW.status_aprovacao := 'pendente';
      NEW.plano_atual_id := NULL;
      NEW.plano_data_vencimento := NULL;
      NEW.codigo_suporte := NULL;
      NEW.aprovado_por := NULL;
      NEW.data_aprovacao := NULL;
      NEW.observacoes_admin := NULL;
    END IF;
  ELSIF privileged AND NOT private.admin_mfa_verified(NULL, true) THEN
    -- Administração municipal não pode transferir propriedade ou cidade.
    IF NEW.usuario_id IS DISTINCT FROM OLD.usuario_id
       OR NEW.cidade_id IS DISTINCT FROM OLD.cidade_id THEN
      RAISE EXCEPTION 'Somente administrador geral pode transferir empresa'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NOT privileged THEN
    NEW.usuario_id := OLD.usuario_id;
    NEW.cidade_id := OLD.cidade_id;
    NEW.ativo := OLD.ativo;
    NEW.destaque := OLD.destaque;
    NEW.verificado := OLD.verificado;
    NEW.status_aprovacao := OLD.status_aprovacao;
    NEW.plano_atual_id := OLD.plano_atual_id;
    NEW.plano_data_vencimento := OLD.plano_data_vencimento;
    NEW.codigo_suporte := OLD.codigo_suporte;
    NEW.aprovado_por := OLD.aprovado_por;
    NEW.data_aprovacao := OLD.data_aprovacao;
    NEW.observacoes_admin := OLD.observacoes_admin;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_empresa_sensitive_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_empresa_sensitive_fields_trigger ON public.empresas;
CREATE TRIGGER protect_empresa_sensitive_fields_trigger
BEFORE INSERT OR UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION private.protect_empresa_sensitive_fields();
