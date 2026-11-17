-- Already applied to Supabase production on 2026-11-17.
-- Version 20261117142623: cache auth.uid() once per statement for four
-- admin policies on companies and user_roles, with authorization predicates intact.
BEGIN;
DO $$
DECLARE target record; statement_sql text; new_using text; new_check text; n int:=0;
BEGIN
 FOR target IN
  SELECT tablename,policyname,qual,with_check,roles::text as role_set
  FROM pg_policies
  WHERE schemaname='public' AND (
   (tablename='empresas' AND policyname IN ('Admin cidade pode gerenciar empresas de sua cidade','Admin geral pode gerenciar todas as empresas'))
   OR (tablename='user_roles' AND policyname IN ('Admin geral can manage all roles','Admins can view all roles'))
  )
 LOOP
  IF target.role_set <> '{authenticated}' OR
     position('auth.uid()' IN coalesce(target.qual,'') || coalesce(target.with_check,'')) = 0
  THEN RAISE EXCEPTION 'Unexpected admin policy % on %',target.policyname,target.tablename; END IF;
  new_using:=replace(target.qual,'auth.uid()','(select auth.uid())');
  new_check:=replace(target.with_check,'auth.uid()','(select auth.uid())');
  statement_sql:=format('ALTER POLICY %I ON public.%I ',target.policyname,target.tablename);
  IF new_using IS NOT NULL THEN statement_sql:=statement_sql||format('USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN
   IF new_using IS NOT NULL THEN statement_sql:=statement_sql||' '; END IF;
   statement_sql:=statement_sql||format('WITH CHECK (%s)',new_check);
  END IF;
  EXECUTE statement_sql;
  n:=n+1;
 END LOOP;
 IF n<>4 THEN RAISE EXCEPTION 'Expected 4 policies, got %',n; END IF;
END $$;
COMMIT;
