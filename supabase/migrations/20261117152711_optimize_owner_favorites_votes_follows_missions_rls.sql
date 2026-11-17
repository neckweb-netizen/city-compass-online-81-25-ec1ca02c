-- Applied in Supabase production on 2026-11-17 (remote migration 20261117152711).
-- Owner-specific policies use statement-stable auth.uid() initplans, with
-- former public owner policies restricted to authenticated; no ownership predicate changes.
BEGIN;
DO $$
DECLARE rec record; stmt text; new_using text; new_check text; n integer:=0; public_count integer:=0;
BEGIN
 FOR rec IN
 SELECT tablename,policyname,qual,with_check,roles::text role_set
 FROM pg_policies WHERE schemaname='public' AND
 (
 (tablename='favoritos' AND policyname IN ('Usuários podem criar favoritos','Usuários podem remover favoritos','Usuários podem ver seus favoritos'))
 OR (tablename='seguidores_problema' AND policyname IN ('Usuários podem deixar de seguir','Usuários podem seguir problemas','Usuários podem ver seus seguidores'))
 OR (tablename='user_missions' AND policyname IN ('Usuários podem atualizar suas missões','Usuários podem ver suas missões'))
 OR (tablename='votos_comentario' AND policyname IN ('Usuários podem atualizar votos em comentários','Usuários podem remover votos em comentários','Usuários podem votar em comentários'))
 OR (tablename='votos_problema' AND policyname IN ('Usuários podem atualizar seus votos','Usuários podem remover seus votos','Usuários podem votar'))
 )
 LOOP
  IF rec.role_set NOT IN ('{authenticated}','{public}') OR
     position('auth.uid()' IN coalesce(rec.qual,'')||coalesce(rec.with_check,''))=0 THEN
    RAISE EXCEPTION 'Unexpected policy %.%',rec.tablename,rec.policyname;
  END IF;
  IF rec.role_set='{public}' AND rec.tablename NOT IN ('favoritos','user_missions') THEN
    RAISE EXCEPTION 'Unexpected public policy %.%',rec.tablename,rec.policyname;
  END IF;
  IF rec.role_set='{public}' THEN public_count:=public_count+1; END IF;
  new_using:=replace(rec.qual,'auth.uid()','(select auth.uid())');
  new_check:=replace(rec.with_check,'auth.uid()','(select auth.uid())');
  stmt:=format('ALTER POLICY %I ON public.%I',rec.policyname,rec.tablename);
  IF rec.role_set='{public}' THEN stmt:=stmt||' TO authenticated'; END IF;
  IF new_using IS NOT NULL THEN stmt:=stmt||format(' USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN stmt:=stmt||format(' WITH CHECK (%s)',new_check); END IF;
  EXECUTE stmt;
  n:=n+1;
 END LOOP;
 IF n<>14 OR public_count<>4 THEN
  RAISE EXCEPTION 'Expected 14 policies, four public roles, got % / %',n,public_count;
 END IF;
END $$;
COMMIT;
