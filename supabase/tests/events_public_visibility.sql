-- Read-only post-migration regression guard for event public visibility.
-- Run after migrations in the target environment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'eventos'
      AND policyname = 'Todos podem ver eventos ativos'
  ) THEN
    RAISE EXCEPTION 'Security regression: active-only public event policy still exists';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'eventos'
      AND policyname = 'Todos podem ver eventos aprovados'
      AND cmd = 'SELECT'
      AND qual LIKE '%status_aprovacao%'
      AND qual LIKE '%ativo%'
  ) THEN
    RAISE EXCEPTION 'Missing approved-and-active public event visibility policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'eventos'
      AND policyname = 'Usuários podem ver seus próprios eventos'
  ) THEN
    RAISE EXCEPTION 'Owner visibility unexpectedly removed';
  END IF;
END;
$$;
