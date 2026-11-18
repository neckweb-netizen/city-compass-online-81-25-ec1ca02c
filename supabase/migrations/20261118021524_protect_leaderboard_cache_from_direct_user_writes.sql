-- Already applied to Supabase production as migration 20261118021524.
-- Ranking cache is maintained by privileged internal routines; preserve public read.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.leaderboard_cache FROM authenticated;
DROP POLICY "leaderboard_cache_auth_policy" ON public.leaderboard_cache;
