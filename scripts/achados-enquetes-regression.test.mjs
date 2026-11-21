import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('public and admin lost-and-found searches ignore stale filter responses', () => {
  for (const file of ['src/pages/AchadosPerdidos.tsx', 'src/pages/admin/AdminAchadosPerdidos.tsx']) {
    const text = read(file);
    assert.match(text, /fetchSequence = useRef\(0\)/);
    assert.match(text, /const sequence = \+\+fetchSequence\.current/);
    assert.match(text, /if \(sequence === fetchSequence\.current\) setItens\(/);
    assert.match(text, /return \(\) => \{ fetchSequence\.current \+= 1; \}/);
  }
});

test('lost-and-found personal tab is cleared if login ends', () => {
  const page = read('src/pages/AchadosPerdidos.tsx');
  assert.match(page, /!usuarioLogadoId && filtroTipo === "meus"/);
  assert.match(page, /setFiltroTipo\("todos"\)/);
  assert.match(page, /if \(filtroTipo === "meus" && !usuarioLogadoId\)/);
});

test('poll dates are shown and saved as Bahia wall time', () => {
  const form = read('src/components/admin/sections/EnquetesSection.tsx');
  assert.match(form, /timeZone: 'America\/Bahia'/);
  assert.match(form, /fromBahiaDateTimeLocal\(form\.data_inicio\)/);
  assert.match(form, /fromBahiaDateTimeLocal\(form\.data_fim\)/);
  assert.match(form, /toBahiaDateTimeLocal\(new Date\(enquete\.data_inicio\)\)/);
  assert.match(form, /toBahiaDateTimeLocal\(new Date\(enquete\.data_fim\)\)/);
});

test('poll vote state resets after switching accounts', () => {
  const page = read('src/components/home/EnqueteSection.tsx');
  assert.match(page, /\[enqueteAtiva\?\.id, user\?\.id\]/);
});
