-- Prevent admins from one city reading or modifying bookings belonging
-- to companies in another city. General admins retain cross-city access with MFA.
-- Owners keep their own booking permissions without requiring administrator MFA.
DROP POLICY IF EXISTS "Admins podem gerenciar agendamentos" ON public.agendamentos;
CREATE POLICY "Admins podem gerenciar agendamentos"
ON public.agendamentos FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND private.admin_mfa_verified(e.cidade_id, false)
  ))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND private.admin_mfa_verified(e.cidade_id, false)
  ));

DROP POLICY IF EXISTS "Empresas podem ver seus agendamentos" ON public.agendamentos;
CREATE POLICY "Empresas podem ver seus agendamentos"
ON public.agendamentos FOR SELECT TO authenticated
USING ((EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND e.usuario_id = (SELECT auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND private.admin_mfa_verified(e.cidade_id, false)
  )));

DROP POLICY IF EXISTS "Empresas podem atualizar seus agendamentos" ON public.agendamentos;
CREATE POLICY "Empresas podem atualizar seus agendamentos"
ON public.agendamentos FOR UPDATE TO authenticated
USING ((EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND e.usuario_id = (SELECT auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND private.admin_mfa_verified(e.cidade_id, false)
  )))
WITH CHECK ((EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND e.usuario_id = (SELECT auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = empresa_id
      AND private.admin_mfa_verified(e.cidade_id, false)
  )));
