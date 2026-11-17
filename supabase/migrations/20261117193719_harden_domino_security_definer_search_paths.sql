-- Applied and verified in production under migration 20261117193719.
-- Reduces search_path hijacking risk in SECURITY DEFINER routines.
-- Authenticated EXECUTE permissions remain unchanged; anonymous access remains denied.
ALTER FUNCTION public.obter_lobby_domino() SET search_path = '';
ALTER FUNCTION public.obter_ranking_domino(integer) SET search_path = '';
ALTER FUNCTION public.passar_vez_domino(uuid, text) SET search_path = '';
