-- Applied to Supabase production, version 20261117170709.
-- Five audited single-column foreign keys on public events and autonomous services.
-- Kept for migration history; do not reapply manually to production.
BEGIN;
DO $$
DECLARE found_count integer;
BEGIN
 SELECT count(*) INTO found_count
 FROM pg_constraint c
 JOIN pg_class t ON t.oid=c.conrelid
 JOIN pg_namespace n ON n.oid=t.relnamespace
 JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=c.conkey[1]
 WHERE n.nspname='public' AND c.contype='f' AND cardinality(c.conkey)=1
 AND (t.relname,c.conname,a.attname) IN (
 ('eventos','eventos_empresa_id_fkey','empresa_id'),
 ('eventos','eventos_categoria_id_fkey','categoria_id'),
 ('servicos_autonomos','servicos_autonomos_cidade_id_fkey','cidade_id'),
 ('servicos_autonomos','servicos_autonomos_categoria_id_fkey','categoria_id'),
 ('servicos_autonomos','servicos_autonomos_usuario_id_fkey','usuario_id'));
 IF found_count<>5 THEN RAISE EXCEPTION 'Expected five known foreign keys, found %',found_count; END IF;
 IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname IN
 ('idx_eventos_empresa_fk','idx_eventos_categoria_fk','idx_autonomos_cidade_fk','idx_autonomos_categoria_fk','idx_autonomos_usuario_fk'))
 THEN RAISE EXCEPTION 'Index name already exists'; END IF;
END $$;
CREATE INDEX idx_eventos_empresa_fk ON public.eventos(empresa_id);
CREATE INDEX idx_eventos_categoria_fk ON public.eventos(categoria_id);
CREATE INDEX idx_autonomos_cidade_fk ON public.servicos_autonomos(cidade_id);
CREATE INDEX idx_autonomos_categoria_fk ON public.servicos_autonomos(categoria_id);
CREATE INDEX idx_autonomos_usuario_fk ON public.servicos_autonomos(usuario_id);
COMMIT;
