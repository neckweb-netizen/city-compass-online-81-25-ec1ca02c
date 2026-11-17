-- Applied in Supabase production 2026-11-17, recorded version 20261117131304.
-- Fix IDOR: authenticated users must not create an autonomous service under another account.
-- Admins retain separate ALL policy; existing owner policy remains unchanged.
BEGIN;
DO $$
DECLARE v_check text; v_admin text; v_owner text;
BEGIN
 SELECT with_check INTO STRICT v_check FROM pg_policies WHERE schemaname='public' AND tablename='servicos_autonomos' AND policyname='Usuários podem criar serviços' AND cmd='INSERT' AND roles::text='{authenticated}';
 IF v_check <> '((auth.uid() = usuario_id) OR (auth.uid() IS NOT NULL))' THEN RAISE EXCEPTION 'Unexpected insert policy; aborting'; END IF;
 SELECT qual INTO STRICT v_admin FROM pg_policies WHERE schemaname='public' AND tablename='servicos_autonomos' AND policyname='Admins podem gerenciar todos os serviços' AND cmd='ALL';
 IF v_admin <> 'user_has_permission()' THEN RAISE EXCEPTION 'Admin path unexpectedly changed'; END IF;
 SELECT with_check INTO STRICT v_owner FROM pg_policies WHERE schemaname='public' AND tablename='servicos_autonomos' AND policyname='Proprietários podem gerenciar seus serviços' AND cmd='ALL';
 IF v_owner <> '(usuario_id = auth.uid())' THEN RAISE EXCEPTION 'Owner check unexpectedly changed'; END IF;
END $$;
ALTER POLICY "Usuários podem criar serviços" ON public.servicos_autonomos WITH CHECK ((select auth.uid()) = usuario_id);
COMMIT;