import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20261117125657_restrict_owner_policies_to_authenticated_and_dedupe_products.sql', import.meta.url), 'utf8');

test('keep exactly one public active-product rule and do not remove product listing', () => {
  assert.match(migration, /DROP POLICY "Todos podem ver produtos ativos" ON public\.produtos/);
  assert.match(migration, /policyname='Produtos ativos são visíveis para todos'/);
  assert.match(migration, /r\.qual <> '\(ativo = true\)'/);
  assert.doesNotMatch(migration, /DROP POLICY "Produtos ativos são visíveis para todos"/);
});

test('scope owner policies to authenticated without changing their predicates', () => {
  const expected = [
    ['produtos', 'Empresas podem atualizar seus próprios produtos'],
    ['produtos', 'Empresas podem criar seus próprios produtos'],
    ['produtos', 'Empresas podem excluir seus próprios produtos'],
    ['avaliacoes', 'Usuários podem atualizar suas avaliações'],
    ['avaliacoes', 'Usuários podem criar avaliações'],
    ['avaliacoes', 'Usuários podem excluir suas próprias avaliações'],
    ['empresas', 'Proprietários podem gerenciar suas empresas'],
    ['empresas', 'Usuários podem criar empresas'],
    ['eventos', 'Usuários podem ver seus próprios eventos'],
  ];
  for (const [table, policy] of expected) {
    assert.ok(migration.includes('ALTER POLICY "' + policy + '" ON public.' + table + ' TO authenticated;'), 'missing owner scope: ' + policy);
  }
  assert.equal((migration.match(/ALTER POLICY /g) ?? []).length, expected.length);
  assert.doesNotMatch(migration, /ALTER POLICY[\s\S]*USING\s*\(/i);
  assert.doesNotMatch(migration, /ALTER POLICY[\s\S]*WITH CHECK\s*\(/i);
});
