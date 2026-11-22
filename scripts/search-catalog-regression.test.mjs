import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('local search retains the cards and allows accessible URL-backed filters', () => {
  const search = read('src/components/search/SearchContent.tsx');
  const locations = read('src/pages/Locais.tsx');
  assert.match(search, /setSearchParams\(next, \{ replace: true \}\)/);
  assert.match(search, /setFilter\('q', e\.target\.value\)/);
  assert.match(search, /setFilter\('categoria', categoria\.id\)/);
  assert.match(search, /setFilter\('cidade', value\)/);
  assert.match(search, /aria-pressed=\{selectedCategory === categoria\.id\}/);
  assert.match(search, /aria-label="Filtrar por cidade"/);
  assert.match(search, /filteredEmpresas\.map\(empresa => <LocalCard/);
  assert.match(locations, /<SearchContent \/>/);
});

test('catalog errors must not masquerade as zero search results', () => {
  const search = read('src/components/search/SearchContent.tsx');
  assert.match(search, /empresasError \|\| categoriasError \|\| cidadesError/);
  assert.match(search, /role="alert"/);
  assert.match(search, /void refetchEmpresas\(\); void refetchCategorias\(\); void refetchCidades\(\)/);
  assert.match(search, /Nenhum local encontrado com os filtros aplicados/);
});

test('catalog search never renders non-approved companies directly', () => {
  const hook = read('src/hooks/useEmpresas.tsx');
  assert.match(hook, /\.eq\('ativo', true\)/);
  assert.match(hook, /\.eq\('status_aprovacao', 'aprovado'\)/);
});
