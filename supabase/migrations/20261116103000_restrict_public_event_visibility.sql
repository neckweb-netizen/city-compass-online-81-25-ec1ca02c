-- Security fix: a legacy public SELECT policy exposes active events even when pending approval.
-- The existing approved-events policy and owner/admin policies remain unchanged.
-- Backout (only if explicitly required): recreate the legacy policy recorded in the audit;
-- doing so deliberately restores public access to unapproved active events.
DROP POLICY IF EXISTS "Todos podem ver eventos ativos" ON public.eventos;

-- Fail deployment if the intended anonymous visibility rule is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'eventos'
      AND policyname = 'Todos podem ver eventos aprovados'
      AND cmd = 'SELECT'
      AND qual LIKE '%status_aprovacao%'
      AND qual LIKE '%ativo%'
  ) THEN
    RAISE EXCEPTION 'Required approved-events SELECT policy missing; review before deploying';
  END IF;
END;
$$;
