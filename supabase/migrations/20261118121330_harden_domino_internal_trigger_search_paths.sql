-- Already applied in production Supabase under migration 20261118121330.
-- Harden internal domino trigger function search paths without changing logic.
ALTER FUNCTION public.processar_fila_domino() SET search_path = '';
ALTER FUNCTION public.preparar_nova_partida_domino() SET search_path = '';
ALTER FUNCTION public.registrar_empate_domino_ao_trancar() SET search_path = '';
