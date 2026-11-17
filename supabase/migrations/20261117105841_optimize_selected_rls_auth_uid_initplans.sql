-- Applied to production 2026-11-17. Same migration version as Supabase history.
-- Preserve role grants, policy commands, row ownership and checks.
-- Only cache the session-stable auth.uid() lookup per statement.
BEGIN;
DO $$
DECLARE
  target record;
  new_using text;
  new_check text;
  cmd text;
  processed integer := 0;
BEGIN
  FOR target IN
    SELECT tablename,policyname,qual,with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND (
        (tablename='avaliacoes' AND policyname IN ('Usuários podem atualizar suas avaliações','Usuários podem criar avaliações','Usuários podem excluir suas próprias avaliações'))
        OR (tablename='empresas' AND policyname IN ('Proprietários podem gerenciar suas empresas','Usuários podem atualizar suas próprias empresas','Usuários podem criar empresas','Usuários podem ver suas próprias empresas'))
        OR (tablename='eventos' AND policyname='Usuários autenticados podem criar eventos')
        OR (tablename='user_roles' AND policyname='Users can view their own roles')
      )
  LOOP
    IF position('auth.uid()' IN coalesce(target.qual,'') || coalesce(target.with_check,'')) = 0 THEN
      RAISE EXCEPTION 'Policy % on % changed unexpectedly',target.policyname,target.tablename;
    END IF;
    new_using := replace(target.qual,'auth.uid()','(select auth.uid())');
    new_check := replace(target.with_check,'auth.uid()','(select auth.uid())');
    cmd := format('ALTER POLICY %I ON public.%I ',target.policyname,target.tablename);
    IF new_using IS NOT NULL THEN
      cmd := cmd || format('USING (%s)',new_using);
    END IF;
    IF new_check IS NOT NULL THEN
      IF new_using IS NOT NULL THEN cmd := cmd || ' '; END IF;
      cmd := cmd || format('WITH CHECK (%s)',new_check);
    END IF;
    EXECUTE cmd;
    processed := processed+1;
  END LOOP;
  IF processed <> 9 THEN RAISE EXCEPTION 'Expected 9 policies; found %',processed; END IF;
END $$;
COMMIT;
