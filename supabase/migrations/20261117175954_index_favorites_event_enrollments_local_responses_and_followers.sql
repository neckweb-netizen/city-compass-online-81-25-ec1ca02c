-- Applied to Supabase production on 2026-11-17 as version 20261117175954.
-- Index four verified single-column foreign keys for user-facing interactions.
-- Do not execute manually on production a second time.
BEGIN;
DO $$
DECLARE v_count int;
BEGIN
 SELECT count(*) INTO v_count
 FROM pg_constraint c
 JOIN pg_class t ON t.oid=c.conrelid
 JOIN pg_namespace n ON n.oid=t.relnamespace
 JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=c.conkey[1]
 WHERE n.nspname='public' AND c.contype='f' AND cardinality(c.conkey)=1
 AND (t.relname,c.conname,a.attname) IN (
 ('favoritos','favoritos_empresa_id_fkey','empresa_id'),
 ('evento_inscricoes','evento_inscricoes_usuario_id_fkey','usuario_id'),
 ('pedido_local_respostas','pedido_local_respostas_empresa_id_fkey','empresa_id'),
 ('seguidores_problema','seguidores_problema_usuario_id_fkey','usuario_id')
 );
 IF v_count <> 4 THEN RAISE EXCEPTION 'Expected exactly 4 verified foreign keys; found %',v_count; END IF;
 IF EXISTS (
  SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname IN (
   'idx_favoritos_empresa_fk','idx_evento_inscricoes_usuario_fk',
   'idx_pedido_respostas_empresa_fk','idx_seguidores_problema_usuario_fk'
  )
 ) THEN RAISE EXCEPTION 'Index naming collision'; END IF;
END $$;
CREATE INDEX idx_favoritos_empresa_fk ON public.favoritos(empresa_id);
CREATE INDEX idx_evento_inscricoes_usuario_fk ON public.evento_inscricoes(usuario_id);
CREATE INDEX idx_pedido_respostas_empresa_fk ON public.pedido_local_respostas(empresa_id);
CREATE INDEX idx_seguidores_problema_usuario_fk ON public.seguidores_problema(usuario_id);
COMMIT;
