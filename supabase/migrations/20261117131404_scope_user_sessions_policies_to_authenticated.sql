-- Applied in Supabase production 2026-11-17, recorded version 20261117131404.
-- User-owned sessions have no anonymous access; restrict five identity-based
-- policies to authenticated without modifying USING / WITH CHECK predicates.
BEGIN;
DO $$
DECLARE target record; count_checked int := 0;
BEGIN
 FOR target IN
 SELECT policyname, cmd, roles::text as roles, qual, with_check FROM pg_policies
 WHERE schemaname='public' AND tablename='user_sessions'
 AND policyname IN ('Admins podem ver todas sessões','Usuários podem atualizar suas sessões','Usuários podem criar suas sessões','Usuários podem excluir suas sessões','Usuários podem ver suas sessões')
 LOOP
 IF target.roles <> '{public}' OR coalesce(target.qual,'') || coalesce(target.with_check,'') NOT LIKE '%auth.uid()%' THEN
   RAISE EXCEPTION 'Unexpected policy % changed in user_sessions',target.policyname;
 END IF;
 count_checked := count_checked + 1;
 END LOOP;
 IF count_checked <> 5 THEN RAISE EXCEPTION 'Expected 5 scoped session policies, got %',count_checked; END IF;
END $$;
ALTER POLICY "Admins podem ver todas sessões" ON public.user_sessions TO authenticated;
ALTER POLICY "Usuários podem atualizar suas sessões" ON public.user_sessions TO authenticated;
ALTER POLICY "Usuários podem criar suas sessões" ON public.user_sessions TO authenticated;
ALTER POLICY "Usuários podem excluir suas sessões" ON public.user_sessions TO authenticated;
ALTER POLICY "Usuários podem ver suas sessões" ON public.user_sessions TO authenticated;
COMMIT;