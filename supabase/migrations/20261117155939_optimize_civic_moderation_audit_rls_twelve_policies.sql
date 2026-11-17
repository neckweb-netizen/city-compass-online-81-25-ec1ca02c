-- Already applied to Supabase production on 2026-11-17, remote version 20261117155939.
-- Optimize auth.uid() in twelve civic/moderation/audit RLS policies.
-- Owner/admin conditions remain unchanged; three formerly public identity-based
-- policies become authenticated-only.
BEGIN;
DO $$
DECLARE target record; stmt text; new_using text; new_check text; processed int:=0; public_count int:=0;
BEGIN
 FOR target IN
  SELECT tablename,policyname,qual,with_check,roles::text AS role_set
  FROM pg_policies WHERE schemaname='public' AND (tablename,policyname) IN (
   ('audit_logs','Apenas admins podem acessar logs de auditoria'),
   ('comentarios_problema','Usuários autenticados podem comentar'),
   ('comentarios_problema','Usuários podem editar seus comentários'),
   ('comentarios_problema','Usuários podem excluir seus comentários'),
   ('notificacoes_whatsapp_log','Admins podem ver logs de notificações'),
   ('problemas_cidade','Admins podem moderar problemas'),
   ('problemas_cidade','Usuários autenticados podem criar problemas'),
   ('problemas_cidade','Usuários podem editar seus problemas'),
   ('rate_limits','Admins podem visualizar rate limits'),
   ('respostas_enquete','Admins podem ver respostas'),
   ('suporte_logs','Admins podem gerenciar logs de suporte'),
   ('usuario_empresa_admin','Usuários podem ver suas próprias atribuições')
  )
 LOOP
  IF target.role_set NOT IN ('{authenticated}','{public}') OR
     position('auth.uid()' IN coalesce(target.qual,'') || coalesce(target.with_check,''))=0
  THEN RAISE EXCEPTION 'Unexpected RLS policy %.%',target.tablename,target.policyname; END IF;
  IF target.role_set='{public}' AND target.tablename NOT IN ('rate_limits','respostas_enquete','usuario_empresa_admin') THEN
    RAISE EXCEPTION 'Unexpected public role %.%',target.tablename,target.policyname;
  END IF;
  IF target.role_set='{public}' THEN public_count:=public_count+1; END IF;
  new_using:=replace(target.qual,'auth.uid()','(select auth.uid())');
  new_check:=replace(target.with_check,'auth.uid()','(select auth.uid())');
  stmt:=format('ALTER POLICY %I ON public.%I',target.policyname,target.tablename);
  IF target.role_set='{public}' THEN stmt:=stmt||' TO authenticated'; END IF;
  IF new_using IS NOT NULL THEN stmt:=stmt||format(' USING (%s)',new_using); END IF;
  IF new_check IS NOT NULL THEN stmt:=stmt||format(' WITH CHECK (%s)',new_check); END IF;
  EXECUTE stmt;
  processed:=processed+1;
 END LOOP;
 IF processed<>12 OR public_count<>3 THEN
    RAISE EXCEPTION 'Expected 12 selected policies and 3 public roles; found % and %',processed,public_count;
 END IF;
END $$;
COMMIT;
