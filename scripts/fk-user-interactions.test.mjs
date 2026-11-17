import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117175954_index_favorites_event_enrollments_local_responses_and_followers.sql',import.meta.url),'utf8');

test('four verified user-facing FK indexes and guards', () => {
 const indexes=[
  'CREATE INDEX idx_favoritos_empresa_fk ON public.favoritos(empresa_id);',
  'CREATE INDEX idx_evento_inscricoes_usuario_fk ON public.evento_inscricoes(usuario_id);',
  'CREATE INDEX idx_pedido_respostas_empresa_fk ON public.pedido_local_respostas(empresa_id);',
  'CREATE INDEX idx_seguidores_problema_usuario_fk ON public.seguidores_problema(usuario_id);',
 ];
 for(const index of indexes) assert.ok(sql.includes(index),index);
 assert.equal((sql.match(/^CREATE INDEX /gm)||[]).length,4);
 assert.match(sql,/v_count <> 4/);
 assert.match(sql,/c.contype='f'/);
 assert.match(sql,/cardinality\(c.conkey\)=1/);
 assert.doesNotMatch(sql,/DROP INDEX|DROP TABLE|ALTER TABLE|GRANT |REVOKE |pix_payment_intents|cobrancas_usuario/);
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
});
