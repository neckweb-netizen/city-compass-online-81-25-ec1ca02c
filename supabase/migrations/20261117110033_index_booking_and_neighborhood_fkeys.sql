-- Applied to production 2026-11-17. Recorded version 20261117110033.
-- Cover foreign keys used by booking and neighborhood lookups.
-- Existing indexes were checked before application.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_usuario_id ON public.agendamentos (cliente_usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico_id ON public.agendamentos (servico_id);
CREATE INDEX IF NOT EXISTS idx_bairros_cidade_id ON public.bairros (cidade_id);
COMMIT;
