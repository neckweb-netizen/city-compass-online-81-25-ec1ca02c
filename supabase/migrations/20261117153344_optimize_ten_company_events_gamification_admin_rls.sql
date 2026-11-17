-- Applied to Supabase production on 2026-11-17, version 20261117153344.
-- Preserve original authorization predicates and policy roles. Optimize
-- auth.uid() using a statement-stable SELECT expression for ten RLS policies.
BEGIN;
DO $$
DECLARE rec record; statement_sql text; altered_using text; altered_check text; processed integer:=0;
BEGIN
 FOR rec IN
 SELECT tablename,policyname,qual,with_check,roles::text role_set
 FROM pg_policies WHERE schemaname='public' AND (tablename,policyname) IN (
 ('badges','Admins podem gerenciar badges'),
 ('conversion_events','Admins podem ver conversões'),
 ('eventos','Usuários podem ver seus próprios eventos'),
 ('gamification_levels','Admins podem gerenciar níveis'),
 ('missions','Admins podem gerenciar missões'),
 ('produtos','Empresas podem criar seus próprios produtos'),
 ('produtos','Empresas podem excluir seus próprios produtos'),
 ('user_journey','Admins podem ver jornadas'),
 ('user_points','Usuários podem ver seus pontos'),
 ('user_tracking_events','Admins podem ver todos os eventos')
 )
 LOOP
  IF rec.role_set <> '{authenticated}' OR
    position('auth.uid()' IN coalesce(rec.qual,'')||coalesce(rec.with_check,''))=0 THEN
    RAISE EXCEPTION 'Unexpected policy state %.%',rec.tablename,rec.policyname;
  END IF;
  altered_using := replace(rec.qual,'auth.uid()','(select auth.uid())');
  altered_check := replace(rec.with_check,'auth.uid()','(select auth.uid())');
  statement_sql := format('ALTER POLICY %I ON public.%I',rec.policyname,rec.tablename);
  IF altered_using IS NOT NULL THEN statement_sql:=statement_sql||format(' USING (%s)',altered_using); END IF;
  IF altered_check IS NOT NULL THEN statement_sql:=statement_sql||format(' WITH CHECK (%s)',altered_check); END IF;
  EXECUTE statement_sql;
  processed:=processed+1;
 END LOOP;
 IF processed<>10 THEN RAISE EXCEPTION 'Expected 10 policies, got %',processed; END IF;
END $$;
COMMIT;
