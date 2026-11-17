import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117170709_index_event_and_autonomous_service_foreign_keys.sql', import.meta.url), 'utf8');

test('five verified non-payment event and autonomous service FK indexes', () => {
  const indexes = [
    'CREATE INDEX idx_eventos_empresa_fk ON public.eventos(empresa_id);',
    'CREATE INDEX idx_eventos_categoria_fk ON public.eventos(categoria_id);',
    'CREATE INDEX idx_autonomos_cidade_fk ON public.servicos_autonomos(cidade_id);',
    'CREATE INDEX idx_autonomos_categoria_fk ON public.servicos_autonomos(categoria_id);',
    'CREATE INDEX idx_autonomos_usuario_fk ON public.servicos_autonomos(usuario_id);',
  ];
  for (const index of indexes) assert.ok(sql.includes(index), index);
  assert.equal((sql.match(/^CREATE INDEX /gm) ?? []).length, 5);
  assert.match(sql, /found_count<>5/);
  assert.match(sql, /c.contype='f'/);
  assert.match(sql, /cardinality\(c.conkey\)=1/);
  assert.doesNotMatch(sql, /DROP INDEX|DROP TABLE|ALTER TABLE|GRANT |REVOKE |pix_payment_intents|pagamentos_planos/);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
});
