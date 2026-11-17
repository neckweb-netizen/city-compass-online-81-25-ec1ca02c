-- Applied in Supabase production 2026-11-17, recorded version 20261117131347.
-- Two explicit read policies already allow SELECT for approved services for anon
-- and authenticated; drop only a self-referencing public policy.
BEGIN;
DO $$
DECLARE v_public text; v_anon text; v_auth text;
BEGIN
 SELECT qual INTO STRICT v_public FROM pg_policies
 WHERE schemaname='public' AND tablename='servicos_autonomos'
 AND policyname='Usuários podem ver serviços aprovados com proteção de conta'
 AND cmd='SELECT' AND roles::text='{public}';
 IF v_public NOT LIKE '%status_aprovacao%' OR v_public NOT LIKE '%servicos_autonomos_1%' THEN
 RAISE EXCEPTION 'Unexpected public service SELECT policy; abort'; END IF;
 SELECT qual INTO STRICT v_anon FROM pg_policies WHERE schemaname='public' AND tablename='servicos_autonomos'
 AND policyname='Usuários não autenticados podem ver serviços aprovados (sem ' AND cmd='SELECT' AND roles::text='{anon}';
 SELECT qual INTO STRICT v_auth FROM pg_policies WHERE schemaname='public' AND tablename='servicos_autonomos'
 AND policyname='Usuários autenticados podem ver serviços aprovados (com conta' AND cmd='SELECT' AND roles::text='{authenticated}';
 IF v_anon <> '(status_aprovacao = ''aprovado''::status_servico)'
 OR v_auth <> v_anon THEN RAISE EXCEPTION 'Approved public read policies changed'; END IF;
END $$;
DROP POLICY "Usuários podem ver serviços aprovados com proteção de conta" ON public.servicos_autonomos;
COMMIT;