import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('production page never assumes active when the configuration fails', () => {
  const hook = read('src/hooks/useProducaoLocal.ts');
  const page = read('src/pages/ProducaoLocal.tsx');
  assert.doesNotMatch(hook, /placeholderData: true/);
  assert.match(hook, /if \(error\) throw error/);
  assert.match(hook, /producao_local_ativa === true/);
  assert.match(page, /if \(disponibilidade\.isError\)/);
  assert.match(page, /disponibilidade\.refetch\(\)/);
});
test('local producer and product searches combine filters rather than matching unrelated terms', () => {
  const page = read('src/pages/ProducaoLocal.tsx');
  assert.match(page, /const corresponde = \(texto: string\)/);
  assert.match(page, /\(!termoBusca \|\| texto\.includes\(termoBusca\)\) &&/);
  assert.match(page, /termosCultura\.some\(termo => texto\.includes\(termo\)\)/);
  assert.match(page, /produtoresQuery\.isError/);
  assert.match(page, /produtosQuery\.isError/);
});
test('admin producer approval and configuration require an affected database record', () => {
  const admin = read('src/pages/admin/AdminProducaoLocal.tsx');
  assert.match(admin, /if \(error \|\| !updated\)/);
  assert.match(admin, /\.select\('id'\)\.maybeSingle\(\)/);
  assert.match(admin, /if \(!authData\.user\?\.id\)/);
  assert.match(admin, /loadError \? null/);
});
test('rural submissions block double clicks and tool catalog does not overpromise privacy', () => {
  const form = read('src/components/producao/ProdutorCadastroDialog.tsx');
  const catalog = read('src/pages/FerramentasCatalog.tsx');
  assert.match(form, /if \(!user \|\| !valid \|\| submittingRef\.current\) return/);
  assert.match(form, /submittingRef\.current = false/);
  assert.match(catalog, /algumas guardam dados no seu dispositivo, enquanto outras exigem login/);
});


test('active catalog keeps tool cards in place and describes actual billing capabilities', () => {
  const catalog = read('src/pages/FerramentasCatalog.tsx');
  assert.match(catalog, /Gestão de Cobranças — Mensagens/);
  assert.match(catalog, /não mantém cadastro de clientes nem histórico de dívidas/);
  assert.match(catalog, /requiresLogin\.has\(item\.id\) \? 'Login para criar' : 'Acesso livre'/);
  assert.match(catalog, /getSafeNavigationUrl\(b\.link_destino\)/);
  assert.match(catalog, /return safeUrl \?/);
  for (const tool of ['gerador-rifa','gerador-cobranca','criador-curriculo','gestao-cobrancas','cardapio-digital']) {
    assert.match(catalog, new RegExp("id: '"+tool+"'"));
  }
});
