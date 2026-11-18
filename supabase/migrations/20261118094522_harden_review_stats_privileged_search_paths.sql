-- Already applied to Supabase production as migration 20261118094522.
-- The function bodies only use schema-qualified application objects.
ALTER FUNCTION public.atualizar_estatisticas_empresa(uuid) SET search_path = '';
ALTER FUNCTION public.trigger_atualizar_estatisticas() SET search_path = '';
ALTER FUNCTION public.trigger_refresh_populares() SET search_path = '';
