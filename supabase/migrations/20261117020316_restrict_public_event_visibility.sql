-- Applied to production on 2026-11-17 as migration restrict_public_event_visibility.
-- Public anonymous readers must see only approved active events; owners/admins retain separate policies.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='eventos'
      AND policyname='Todos podem ver eventos aprovados'
      AND cmd='SELECT' AND qual LIKE '%status_aprovacao%' AND qual LIKE '%ativo%'
  ) THEN
    RAISE EXCEPTION 'Policy for approved public events missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='eventos'
      AND policyname='Usuários podem ver seus próprios eventos'
  ) THEN
    RAISE EXCEPTION 'Owner visibility policy missing';
  END IF;
END $$;
DROP POLICY IF EXISTS "Todos podem ver eventos ativos" ON public.eventos;
COMMIT;
