-- Applied to Supabase production as migration 20261118015630.
-- Prevent direct mutations of aggregate company statistics by authenticated users.
-- Public SELECT and privileged internal updates are preserved.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.estatisticas FROM authenticated;
DROP POLICY "estatisticas_auth_policy" ON public.estatisticas;
