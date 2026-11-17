import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117163817_index_company_review_comment_foreign_keys.sql',import.meta.url),'utf8');

test('four non-payment foreign key indexes use expected columns and guards',()=>{
  const definitions=[
    'CREATE INDEX idx_empresas_usuario_fk ON public.empresas(usuario_id);',
    'CREATE INDEX idx_empresas_aprovado_por_fk ON public.empresas(aprovado_por);',
    'CREATE INDEX idx_avaliacoes_usuario_fk ON public.avaliacoes(usuario_id);',
    'CREATE INDEX idx_comentarios_pai_fk ON public.comentarios_problema(comentario_pai_id);',
  ];
  for(const definition of definitions) assert.ok(sql.includes(definition),definition);
  assert.equal((sql.match(/^CREATE INDEX /gm)||[]).length,4);
  assert.match(sql,/expected_count <> 4/);
  assert.match(sql,/c.contype='f'/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP INDEX|ALTER TABLE|GRANT |REVOKE /);
  assert.match(sql,/BEGIN;/);
  assert.match(sql,/COMMIT;/);
});
