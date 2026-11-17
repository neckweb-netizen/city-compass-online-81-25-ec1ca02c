-- Already applied to production (Supabase migration version 20261117140328).
-- Cache session-stable auth.uid() in eight existing row-security policies.
-- All USING and WITH CHECK expressions keep the same authorization logic.
BEGIN;
DO $$
DECLARE target record; cmd text; new_using text; new_check text; n int:=0;
BEGIN
 FOR target IN
 SELECT tablename, policyname, qual, with_check FROM pg_policies
 WHERE schemaname='public' AND
 (
 (tablename='user_sessions' AND policyname IN ('Admins podem ver todas as sessões','Admins podem ver todas sessões','Usuários podem atualizar suas sessões','Usuários podem criar suas sessões','Usuários podem excluir suas sessões','Usuários podem ver suas sessões'))
 OR (tablename='avisos_sistema' AND policyname='Admins podem gerenciar avisos')
 OR (tablename='canal_informativo' AND policyname='Admins podem gerenciar canal informativo')
 )
 LOOP
  IF coalesce(target.qual,'')||coalesce(target.with_check,'') NOT LIKE '%auth.uid()%' THEN
    RAISE EXCEPTION 'Policy % unexpectedly changed',target.policyname;
  END IF;
  new_using := replace(target.qual,'auth.uid()','(select auth.uid())');
  new_check := replace(target.with_check,'auth.uid()','(select auth.uid())');
  cmd := format('ALTER POLICY %I ON public.%I ',target.policyname,target.tablename);
  IF new_using IS NOT NULL THEN cmd:=cmd||format('USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN
    IF new_using IS NOT NULL THEN cmd:=cmd||' '; END IF;
    cmd:=cmd||format('WITH CHECK (%s)',new_check);
  END IF;
  EXECUTE cmd;
  n:=n+1;
 END LOOP;
 IF n<>8 THEN RAISE EXCEPTION 'Expected 8 policies, got %',n; END IF;
END $$;
COMMIT;
