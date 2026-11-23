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


test('public menu cart is isolated per slug, with available products only', () => {
  const publicPage = readFileSync(new URL('../src/pages/CardapioPublico.tsx', import.meta.url), 'utf8');
  assert.match(publicPage, /cartState\.slug === slug \? cartState\.quantities : \{\}/);
  assert.match(publicPage, /filter\(item => item\.disponivel\)/);
  assert.match(publicPage, /Math\.min\(99, Math\.max\(0,/);
});

test('WhatsApp order only appears when accepting orders and phone is valid', () => {
  const publicPage = readFileSync(new URL('../src/pages/CardapioPublico.tsx', import.meta.url), 'utf8');
  assert.match(publicPage, /!cardapio\?\.aceita_pedidos/);
  assert.match(publicPage, /normalizeWhatsApp\(cardapio\?\.whatsapp \?\? ''\)/);
  assert.match(publicPage, /!\/\^55\\d\{10,11\}\$\/\.test\(phone\)/);
  assert.match(publicPage, /encodeURIComponent\(message\)/);
});

test('public menu share reports unexpected errors without treating cancellation as failure', () => {
  const publicPage = readFileSync(new URL('../src/pages/CardapioPublico.tsx', import.meta.url), 'utf8');
  assert.match(publicPage, /error instanceof DOMException && error\.name === 'AbortError'/);
  assert.match(publicPage, /Não foi possível compartilhar/);
});
