-- Applied to production on 2026-11-17 as migration
-- 20261117125657_restrict_owner_policies_to_authenticated_and_dedupe_products.
-- Retain the public active-product policy; owner writes require authenticated.
-- Transactional preconditions prevent silently weakening or changing access.
BEGIN;
DO $$
DECLARE r RECORD;
BEGIN
  SELECT policyname, cmd, roles::text, qual INTO r
  FROM pg_policies WHERE schemaname='public' AND tablename='produtos' AND policyname='Todos podem ver produtos ativos';
  IF NOT FOUND OR r.cmd <> 'SELECT' OR r.qual <> '(ativo = true)' OR r.roles NOT LIKE '%public%' THEN
    RAISE EXCEPTION 'Duplicate products public policy did not match expected rule';
  END IF;
  SELECT policyname, cmd, roles::text, qual INTO r
  FROM pg_policies WHERE schemaname='public' AND tablename='produtos' AND policyname='Produtos ativos são visíveis para todos';
  IF NOT FOUND OR r.cmd <> 'SELECT' OR r.qual <> '(ativo = true)' OR r.roles NOT LIKE '%public%' THEN
    RAISE EXCEPTION 'Remaining public products rule not found or differs';
  END IF;
  IF (
    SELECT count(*) FROM pg_policies
    WHERE schemaname='public'
      AND (tablename,policyname) IN (
        ('produtos','Empresas podem atualizar seus próprios produtos'),
        ('produtos','Empresas podem criar seus próprios produtos'),
        ('produtos','Empresas podem excluir seus próprios produtos'),
        ('avaliacoes','Usuários podem atualizar suas avaliações'),
        ('avaliacoes','Usuários podem criar avaliações'),
        ('avaliacoes','Usuários podem excluir suas próprias avaliações'),
        ('empresas','Proprietários podem gerenciar suas empresas'),
        ('empresas','Usuários podem criar empresas'),
        ('eventos','Usuários podem ver seus próprios eventos')
      )
      AND roles = ARRAY['public']::name[]
  ) <> 9 THEN RAISE EXCEPTION 'Expected nine owner policies still TO public'; END IF;
END $$;
DROP POLICY "Todos podem ver produtos ativos" ON public.produtos;
ALTER POLICY "Empresas podem atualizar seus próprios produtos" ON public.produtos TO authenticated;
ALTER POLICY "Empresas podem criar seus próprios produtos" ON public.produtos TO authenticated;
ALTER POLICY "Empresas podem excluir seus próprios produtos" ON public.produtos TO authenticated;
ALTER POLICY "Usuários podem atualizar suas avaliações" ON public.avaliacoes TO authenticated;
ALTER POLICY "Usuários podem criar avaliações" ON public.avaliacoes TO authenticated;
ALTER POLICY "Usuários podem excluir suas próprias avaliações" ON public.avaliacoes TO authenticated;
ALTER POLICY "Proprietários podem gerenciar suas empresas" ON public.empresas TO authenticated;
ALTER POLICY "Usuários podem criar empresas" ON public.empresas TO authenticated;
ALTER POLICY "Usuários podem ver seus próprios eventos" ON public.eventos TO authenticated;
COMMIT;
