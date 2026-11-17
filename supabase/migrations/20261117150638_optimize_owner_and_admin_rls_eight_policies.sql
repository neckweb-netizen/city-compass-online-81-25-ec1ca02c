-- Already applied in Supabase production, version 20261117150638.
-- Preserve existing USING/WITH CHECK semantics; cache auth.uid() through SELECT.
-- Owner policies which previously targeted public now target authenticated.
BEGIN;
DO $$
DECLARE rec record; statement_sql text; new_using text; new_check text; processed integer:=0;
BEGIN
 FOR rec IN
  SELECT tablename,policyname,qual,with_check,roles::text AS role_set
  FROM pg_policies
  WHERE schemaname='public' AND (tablename,policyname) IN (
   ('avaliacoes','Admins podem excluir avaliações'),
   ('categorias_problema','Admins podem gerenciar categorias'),
   ('comentarios_problema','Admins podem moderar comentários'),
   ('enquetes','Admins podem gerenciar enquetes'),
   ('eventos','Empresas podem atualizar seus eventos'),
   ('home_sections_order','Admins podem gerenciar ordem das seções'),
   ('produtos','Empresas podem atualizar seus próprios produtos'),
   ('servicos_autonomos','Proprietários podem gerenciar seus serviços')
  )
 LOOP
  IF position('auth.uid()' IN coalesce(rec.qual,'')||coalesce(rec.with_check,''))=0
    OR rec.role_set NOT IN ('{authenticated}','{public}') THEN
   RAISE EXCEPTION 'Unexpected policy state: %.%',rec.tablename,rec.policyname;
  END IF;
  IF rec.role_set='{public}' AND rec.tablename NOT IN ('avaliacoes','eventos') THEN
    RAISE EXCEPTION 'Unexpected public role on %.%',rec.tablename,rec.policyname;
  END IF;
  new_using:=replace(rec.qual,'auth.uid()','(select auth.uid())');
  new_check:=replace(rec.with_check,'auth.uid()','(select auth.uid())');
  statement_sql:=format('ALTER POLICY %I ON public.%I',rec.policyname,rec.tablename);
  IF rec.role_set='{public}' THEN statement_sql:=statement_sql||' TO authenticated'; END IF;
  IF new_using IS NOT NULL THEN statement_sql:=statement_sql||format(' USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN statement_sql:=statement_sql||format(' WITH CHECK (%s)',new_check); END IF;
  EXECUTE statement_sql;
  processed:=processed+1;
 END LOOP;
 IF processed<>8 THEN RAISE EXCEPTION 'Expected eight policies; found %',processed; END IF;
END $$;
COMMIT;
