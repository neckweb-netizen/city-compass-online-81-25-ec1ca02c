import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('civic voting checks lookup and write errors for posts and comments', () => {
  const hook = read('src/hooks/useProblemasCidade.tsx');
  assert.equal((hook.match(/if \(buscaErro\) throw buscaErro;/g) || []).length, 2);
  assert.ok((hook.match(/if \(error\) throw error;/g) || []).length >= 8);
  assert.match(hook, /Não foi possível registrar o voto/);
  assert.match(hook, /Não foi possível votar neste comentário/);
});

test('vote controls disable while saving and do not lose errors', () => {
  const card = read('src/components/problemas/ProblemaCard.tsx');
  const details = read('src/pages/ProblemaDetalhes.tsx');
  assert.equal((card.match(/disabled=\{!user \|\| votarProblema\.isPending\}/g) || []).length, 2);
  assert.equal((details.match(/disabled=\{!user \|\| votarProblema\.isPending\}/g) || []).length, 2);
});

test('publication retains form after failure and complaint feed has retry state', () => {
  const dialog = read('src/components/problemas/ProblemaFormDialog.tsx');
  const feed = read('src/pages/ProblemasCidade.tsx');
  assert.match(dialog, /catch \{/);
  assert.match(dialog, /form\.reset\(\)/);
  assert.match(feed, /isError \? \(/);
  assert.match(feed, /void refetch\(\)/);
});

test('civic moderation verifies an affected record and locks conflicting actions', () => {
  const admin = read('src/components/admin/sections/ProblemasCidadeSection.tsx');
  assert.match(admin, /\.select\('id'\)\.maybeSingle\(\)/);
  assert.match(admin, /if \(!data\) throw new Error/);
  assert.match(admin, /\.eq\('status_aprovacao', expectedStatus\)/);
  assert.match(admin, /aprovado_por: user\.id/);
  assert.match(admin, /disabled=\{processing\}/);
  assert.match(admin, /isError \?/);
});


test('civic detail fetch displays retry instead of treating network errors as missing reports', () => {
  const hook = read('src/hooks/useProblemasCidade.tsx');
  const page = read('src/pages/ProblemaDetalhes.tsx');
  assert.match(hook, /isError: problemaError, refetch: refetchProblema/);
  assert.match(page, /if \(problemaError\)/);
  assert.match(page, /void refetchProblema\(\)/);
});
