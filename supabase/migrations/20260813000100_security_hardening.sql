-- Remove políticas que permitiam a clientes comuns agir como o "sistema".
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notificacoes;
CREATE POLICY "Somente service role pode criar notificações do sistema"
ON public.notificacoes FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;
CREATE POLICY "Somente service role pode criar notifications do sistema"
ON public.notifications FOR INSERT TO service_role
WITH CHECK (true);

-- URLs curtas passam a exigir usuário autenticado e vínculo com o criador.
DROP POLICY IF EXISTS "Anyone can create short URLs" ON public.short_urls;
CREATE POLICY "Authenticated users can create their own short URLs"
ON public.short_urls FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own short URLs" ON public.short_urls;
CREATE POLICY "Users can update their own short URLs"
ON public.short_urls FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Serviços autônomos devem sempre pertencer ao usuário que está criando o registro.
DROP POLICY IF EXISTS "Usuários podem criar serviços" ON public.servicos_autonomos;
CREATE POLICY "Usuários autenticados podem criar seus serviços"
ON public.servicos_autonomos FOR INSERT TO authenticated
WITH CHECK (usuario_id = auth.uid());

-- Impede autoelevação de privilégio por metadata ou atualização direta do perfil.
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  actor_is_admin boolean := false;
BEGIN
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND tipo_conta IN ('admin_geral', 'admin_cidade')
    ) INTO actor_is_admin;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT actor_is_admin THEN
      NEW.tipo_conta := 'usuario';
    END IF;
  ELSIF NEW.tipo_conta IS DISTINCT FROM OLD.tipo_conta AND NOT actor_is_admin THEN
    NEW.tipo_conta := OLD.tipo_conta;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_role_trigger ON public.usuarios;
CREATE TRIGGER protect_user_role_trigger
BEFORE INSERT OR UPDATE OF tipo_conta ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();
