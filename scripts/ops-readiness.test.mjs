import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('migrations match deployed immutable version history and preserve access predicates', () => {
  const rls = source('supabase/migrations/20261117105841_optimize_selected_rls_auth_uid_initplans.sql');
  const index = source('supabase/migrations/20261117110033_index_booking_and_neighborhood_fkeys.sql');
  assert.ok(rls.includes("IF processed <> 9"));
  assert.ok(rls.includes("replace(target.qual,'auth.uid()','(select auth.uid())')"));
  assert.ok(rls.includes("replace(target.with_check,'auth.uid()','(select auth.uid())')"));
  assert.ok(!rls.includes('DROP POLICY'));
  for (const field of ['cliente_usuario_id', 'servico_id', 'cidade_id']) {
    assert.ok(index.includes('(' + field + ')'));
  }
  assert.ok(index.includes('IF NOT EXISTS'));
});

test('business signup has no unbounded slug lookup and preserves owner identity', () => {
  const helper = source('src/lib/companySlug.ts');
  assert.ok(helper.includes('crypto.randomUUID()'));
  const pages = [
    source('src/pages/CadastroLocal.tsx'),
    source('src/components/profile/CadastrarEmpresaDialog.tsx'),
  ];
  for (const page of pages) {
    assert.ok(page.includes('createCompanySlug('));
    assert.ok(!page.includes('while (true)'));
    assert.ok(page.includes(".from('empresas')"));
    assert.ok(page.includes('usuario_id:'));
    assert.ok(page.includes('destaque: false'));
  }
  assert.ok(source('src/pages/AnuncieGratis.tsx').includes('Cadastro básico gratuito'));
});

test('safety script is explicitly opt-in and constrained to anonymous public GETs', () => {
  const file = source('scripts/public-read-load-smoke.mjs');
  assert.ok(file.includes("'--allow-small-smoke'"));
  assert.ok(file.includes("'--allow-production'"));
  assert.ok(file.includes('const count = 12'));
  assert.ok(file.includes('const maxParallel = 2'));
  assert.ok(file.includes("method: 'GET'"));
  assert.ok(!file.includes('api/auth'));
  assert.ok(!file.includes('service_role'));
  assert.ok(!file.includes('POST'));
});

test('operations guide does not claim successful backups, restore or high concurrency proof', () => {
  const guide = source('docs/operacao-seguranca-escalabilidade.md');
  assert.ok(guide.includes('não executou exportação de dados nem restauração'));
  assert.ok(guide.includes('não provam'));
  assert.ok(guide.includes('Pix automático'));
});
