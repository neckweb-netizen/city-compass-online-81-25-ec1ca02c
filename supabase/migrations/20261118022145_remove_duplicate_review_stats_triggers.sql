-- Already applied to Supabase production as migration 20261118022145.
-- Duplicate trigger pairs invoked exactly the same routines for identical row events.
-- Keep trigger_avaliacoes_estatisticas and trigger_estatisticas_refresh_populares active.
DROP TRIGGER IF EXISTS atualizar_stats_avaliacoes ON public.avaliacoes;
DROP TRIGGER IF EXISTS refresh_populares_on_stats_change ON public.estatisticas;
