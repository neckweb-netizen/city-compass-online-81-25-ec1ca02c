import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('FIPE requests discard outdated responses across vehicle, reference, brand and model', () => {
  const page = read('src/pages/ferramentas/ConsultaFipe.tsx');
  assert.match(page, /const requestSequence = useRef\(0\)/);
  assert.ok((page.match(/\+\+requestSequence\.current/g) || []).length >= 5);
  assert.ok((page.match(/requestSequence\.current === sequence/g) || []).length >= 9);
  assert.match(page, /return \(\) => \{ requestSequence\.current \+= 1; \}/);
  assert.match(page, /if \(!brandId \|\| !modelId \|\| !yearId \|\| !usage\?\.remaining \|\| loading\) return/);
  assert.match(page, /Não foi possível copiar os dados/);
});

test('sales calculator treats bank fees as illustrative and validates Brazilian costs and discounts', () => {
  const page = read('src/pages/ferramentas/CalculadoraMargem.tsx');
  assert.match(page, /parseBrazilianNumber\(val\) \?\? 0/);
  assert.match(page, /parseBrazilianNumber\(descontoPixPercentual\) \?\? -1/);
  assert.match(page, /descPix >= 0 && descPix <= 100/);
  assert.match(page, /taxas exibidas são apenas exemplos/);
  assert.match(page, /confirme a taxa contratada com sua operadora/);
  assert.match(page, /if \(!taxasValidas \|\| custo <= 0\) return/);
});

test('text reader registers and removes voiceschanged listener', () => {
  const page = read('src/pages/ferramentas/LeitorVoz.tsx');
  assert.match(page, /speechSynthesis\.addEventListener\('voiceschanged', carregarVozes\)/);
  assert.match(page, /speechSynthesis\.removeEventListener\('voiceschanged', carregarVozes\)/);
  assert.doesNotMatch(page, /speechSynthesis\.onvoiceschanged\s*=/);
});
