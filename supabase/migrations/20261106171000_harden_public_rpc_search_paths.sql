-- Hardening de RPCs PUBLICAS de leitura que necessitam executar com
-- SECURITY DEFINER para consultar dados agregados/horarios sob RLS.
-- Evita resolver nomes nao qualificados de schemas editaveis no contexto privilegiado.
-- A alteracao foi testada dentro de transacao com ROLLBACK sob a role anon.
ALTER FUNCTION public.buscar_enquete_ativa() SET search_path = '';
ALTER FUNCTION public.listar_horarios_agendamento(uuid,text,date) SET search_path = '';
