-- Applied in Supabase production as migration 20261117235407.
-- The unrestricted public SELECT policy subsumes this owner-specific SELECT.
-- No INSERT/UPDATE/DELETE policies are changed.
DROP POLICY IF EXISTS "Usuários podem ver suas próprias rifas" ON public.rifas_usuarios;
