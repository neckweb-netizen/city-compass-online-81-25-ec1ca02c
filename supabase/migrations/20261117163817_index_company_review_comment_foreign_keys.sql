-- Already applied to Supabase production on 2026-11-17, migration 20261117163817.
-- Add four verified B-tree indexes covering non-payment foreign keys.
-- Do not rerun manually against production: recorded for schema history.
BEGIN;
DO $$
DECLARE expected_count integer;
BEGIN
 SELECT count(*) INTO expected_count FROM pg_constraint c
 JOIN pg_class t ON t.oid=c.conrelid
 JOIN pg_namespace n ON n.oid=t.relnamespace
 WHERE n.nspname='public' AND c.contype='f' AND
 (t.relname,c.conname,c.conkey::text) IN (
  ('empresas','empresas_usuario_id_fkey',(SELECT conkey::text FROM pg_constraint WHERE conrelid='public.empresas'::regclass AND conname='empresas_usuario_id_fkey')),
  ('empresas','empresas_aprovado_por_fkey',(SELECT conkey::text FROM pg_constraint WHERE conrelid='public.empresas'::regclass AND conname='empresas_aprovado_por_fkey')),
  ('avaliacoes','avaliacoes_usuario_id_fkey',(SELECT conkey::text FROM pg_constraint WHERE conrelid='public.avaliacoes'::regclass AND conname='avaliacoes_usuario_id_fkey')),
  ('comentarios_problema','comentarios_problema_comentario_pai_id_fkey',(SELECT conkey::text FROM pg_constraint WHERE conrelid='public.comentarios_problema'::regclass AND conname='comentarios_problema_comentario_pai_id_fkey'))
 );
 IF expected_count <> 4 THEN RAISE EXCEPTION 'Expected four FK constraints, found %',expected_count; END IF;
 IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname IN
  ('idx_empresas_usuario_fk','idx_empresas_aprovado_por_fk','idx_avaliacoes_usuario_fk','idx_comentarios_pai_fk'))
 THEN RAISE EXCEPTION 'Index names already exist'; END IF;
END $$;
CREATE INDEX idx_empresas_usuario_fk ON public.empresas(usuario_id);
CREATE INDEX idx_empresas_aprovado_por_fk ON public.empresas(aprovado_por);
CREATE INDEX idx_avaliacoes_usuario_fk ON public.avaliacoes(usuario_id);
CREATE INDEX idx_comentarios_pai_fk ON public.comentarios_problema(comentario_pai_id);
COMMIT;
