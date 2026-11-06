-- Regressao read-only para uso no Supabase SQL Editor. Não altera dados.
BEGIN;
DO $test$
DECLARE
 exposed text[];
BEGIN
 IF exists (SELECT 1 FROM pg_extension WHERE extname = 'pg_graphql') THEN
  RAISE EXCEPTION 'pg_graphql foi reativado';
 END IF;
 SELECT array_agg(p.proname ORDER BY p.proname)
 INTO exposed
 FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef
 AND has_function_privilege('anon',p.oid,'EXECUTE');
 IF exposed IS DISTINCT FROM ARRAY[
   'buscar_enquete_ativa','criar_agendamento_publico',
   'increment_tool_view','listar_horarios_agendamento'
 ]::text[] THEN
   RAISE EXCEPTION 'Mudanca nos RPCs privileged anon: %', exposed;
 END IF;
 IF NOT has_table_privilege('anon','public.empresas','SELECT') THEN
   RAISE EXCEPTION 'Catalogo de empresas nao esta acessivel';
 END IF;
 IF has_function_privilege('anon','public.get_user_primary_role(uuid)','EXECUTE')
 OR has_function_privilege('anon','public.is_admin(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Funcoes de permissao admin foram abertas para anon';
 END IF;
 IF NOT (
   position('search_path='''''' in pg_get_functiondef('public.buscar_enquete_ativa()'::regprocedure))>0
 ) THEN
   RAISE EXCEPTION 'RPC de enquete sem search_path restrito';
 END IF;
END $test$;
SET LOCAL ROLE anon;
SELECT count(*) <= 1 AS enquete_publica_ok FROM public.buscar_enquete_ativa();
SELECT public.increment_tool_view('invalid-slug') IS NULL AS slug_invalido_rejeitado;
SELECT count(*) = 0 AS empresa_ficticia_sem_horarios
FROM public.listar_horarios_agendamento(
 '00000000-0000-4000-8000-000000000000'::uuid,'nenhum',CURRENT_DATE);
RESET ROLE;
ROLLBACK;
