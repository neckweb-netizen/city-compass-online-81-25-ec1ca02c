import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_SECTIONS, getAdminHomeSections, getPublicHomeSections, serializeHomeSections } from '../src/lib/homeSections.ts';

const row = (name, ordem, ativo = true) => ({ id: `id-${name}`, section_name: name, display_name: name, ordem, ativo });

test('public home follows saved order, including domino, without mutating data', () => {
  const rows = [row('search', 4), row('jogos', 1), row('categories', 3)];
  assert.deepEqual(getPublicHomeSections(rows).map(s => s.section_name), ['jogos', 'categories', 'search']);
  assert.equal(rows[0].section_name, 'search');
});

test('hidden or RLS-omitted games and tools never reappear through defaults', () => {
  assert.deepEqual(getPublicHomeSections([row('jogos', 1, false), row('ferramentas', 2, false)]), []);
  assert.deepEqual(getPublicHomeSections([]), []);
  assert.deepEqual(getPublicHomeSections([row('search', 1)]).map(s => s.section_name), ['search']);
});

test('admin contains each supported section once and preserves saved visibility/order', () => {
  const rows = [row('jogos', 2, false), row('search', 1)];
  const merged = getAdminHomeSections(rows);
  assert.equal(merged.length, Object.keys(HOME_SECTIONS).length);
  assert.equal(merged.filter(s => s.section_name === 'jogos').length, 1);
  assert.deepEqual(merged.slice(0, 2), [rows[1], rows[0]]);
  assert.ok(merged.slice(2).every(s => !s.ativo && s.id.startsWith('pending:')));
});

test('saving a reordered draft retains toggles and excludes temporary IDs', () => {
  const draft = [row('jogos', 18, false), row('search', 1)];
  const updates = serializeHomeSections(draft);
  assert.deepEqual(updates.map(s => [s.section_name, s.ordem, s.ativo]), [['jogos', 1, false], ['search', 2, true]]);
  assert.ok(updates.every(s => !('id' in s)));
  assert.deepEqual(getPublicHomeSections(updates.map(s => ({ ...s, id: s.section_name }))).map(s => s.section_name), ['search']);
});

test('duplicate positions are deterministic and unsupported rows stay admin-only', () => {
  const rows = [row('jogos', 1), row('categories', 1), row('legacy-unknown', 0)];
  assert.deepEqual(getPublicHomeSections(rows).map(s => s.section_name), ['categories', 'jogos']);
  assert.equal(getAdminHomeSections(rows)[0].section_name, 'legacy-unknown');
});

test('empty and duplicate saves are rejected; legacy banner gets correct label', () => {
  assert.throws(() => serializeHomeSections([]));
  assert.throws(() => serializeHomeSections([row('jogos', 1), row('jogos', 2)]));
  assert.equal(serializeHomeSections([row('stats_section', 14)])[0].display_name, 'Banner adicional');
});
