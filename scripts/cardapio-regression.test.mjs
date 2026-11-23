import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/pages/ferramentas/CardapioDigital.tsx', import.meta.url), 'utf8');

test('menu prices use the validated Brazilian parser', () => {
  assert.match(source, /parseBrazilianNumber\(value\)/);
  assert.match(source, /parsedPrice === null \|\| parsedPrice < 0/);
  assert.match(source, /preco: parsedPrice/);
});

test('menu saving and item actions release busy state after network failures', () => {
  assert.ok((source.match(/finally \{\s*setSaving\(false\)/g) || []).length >= 3);
  assert.match(source, /Falha de conexão ao salvar o item/);
  assert.match(source, /Falha de conexão ao salvar o cardápio/);
});

test('menu queries offer recovery and do not keep an indefinite loading screen on error', () => {
  assert.match(source, /if \(menusQuery\.isError \|\| planQuery\.isError\)/);
  assert.match(source, /Não foi possível carregar seus cardápios/);
  assert.match(source, /void menusQuery\.refetch\(\)/);
});

test('menu mutations are constrained to their parent and session owner', () => {
  assert.match(source, /\.eq\('id', cardapio\.id\)\.eq\('user_id', user\.id\)/);
  assert.match(source, /\.eq\('id', editingItemId\)\.eq\('cardapio_id', cardapio\.id\)/);
  assert.match(source, /\.delete\(\)\.eq\('id', item\.id\)\.eq\('cardapio_id', cardapio\.id\)/);
});
