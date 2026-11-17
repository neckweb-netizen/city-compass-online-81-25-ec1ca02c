-- Applied in Supabase production, version 20261117161746.
-- Optimize ten non-payment RLS policies without weakening ownership/admin checks.
-- Review/business-response policies require authentication; shared raffle read stays public.
BEGIN;
DO $$
DECLARE rec record; stmt text; new_using text; new_check text; processed int:=0; public_count int:=0;
BEGIN
 FOR rec IN
 SELECT tablename,policyname,qual,with_check,roles::text role_set
 FROM pg_policies WHERE schemaname='public' AND (tablename,policyname) IN (
 ('achados_perdidos','Admins podem gerenciar achados e perdidos'),
 ('avaliacoes','Empresas podem responder avaliações'),
 ('configuracoes_sistema','Apenas admins podem alterar configuracoes'),
 ('cupons','Empresas podem gerenciar seus cupons'),
 ('enderecos_empresa','Empresas podem gerenciar seus endereços'),
 ('estatisticas','estatisticas_auth_policy'),
 ('leaderboard_cache','leaderboard_cache_auth_policy'),
 ('produtos','Empresas podem gerenciar seus produtos'),
 ('rifas_usuarios','Usuários podem ver suas próprias rifas'),
 ('servicos_agendamento','Empresas podem gerenciar seus serviços')
 )
 LOOP
  IF rec.role_set NOT IN ('{authenticated}','{public}') OR
    position('auth.uid()' IN coalesce(rec.qual,'')||coalesce(rec.with_check,''))=0
  THEN RAISE EXCEPTION 'Policy changed unexpectedly %.%',rec.tablename,rec.policyname; END IF;
  IF rec.role_set='{public}' AND rec.tablename NOT IN ('avaliacoes','rifas_usuarios') THEN
    RAISE EXCEPTION 'Unexpected public policy %.%',rec.tablename,rec.policyname;
  END IF;
  IF rec.role_set='{public}' THEN public_count:=public_count+1; END IF;
  new_using:=replace(rec.qual,'auth.uid()','(select auth.uid())');
  new_check:=replace(rec.with_check,'auth.uid()','(select auth.uid())');
  stmt:=format('ALTER POLICY %I ON public.%I',rec.policyname,rec.tablename);
  IF rec.tablename='avaliacoes' THEN stmt:=stmt||' TO authenticated'; END IF;
  IF new_using IS NOT NULL THEN stmt:=stmt||format(' USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN stmt:=stmt||format(' WITH CHECK (%s)',new_check); END IF;
  EXECUTE stmt;
  processed:=processed+1;
 END LOOP;
 IF processed<>10 OR public_count<>2 THEN
  RAISE EXCEPTION 'Expected 10 policies and 2 public, got % and %',processed,public_count;
 END IF;
END $$;
COMMIT;
