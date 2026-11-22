import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('rescisão rejects malformed currency and calendar dates', () => {
  const source = read('src/pages/ferramentas/SimuladorRescisao.tsx');
  assert.match(source, /parseBrazilianNumber\(valor\.trim\(\)\.replace/);
  assert.match(source, /const parseDataLocal = \(valor: string\): Date \| null/);
  assert.match(source, /date\.getFullYear\(\) === year && date\.getMonth\(\) === month - 1/);
  assert.match(source, /if \(!admissao \|\| !demissao\)/);
  assert.match(source, /if \(demissao\.getFullYear\(\) !== 2026\)/);
  assert.match(source, /salario === null \|\| salario <= 0/);
  assert.match(source, /fgts === null && saldoFgts\.trim\(\)/);
  assert.match(source, /Estimativa informativa para rescisões de 2026/);
});

test('manual billing normalizes Brazilian amounts and never claims clipboard success on failure', () => {
  const source = read('src/pages/ferramentas/GeradorCobranca.tsx');
  assert.match(source, /parseBrazilianNumber\(valor\)/);
  assert.match(source, /valorInvalido = /);
  assert.match(source, /new Intl\.NumberFormat\('pt-BR'/);
  assert.match(source, /await navigator\.clipboard\.writeText\(mensagemFinal\)/);
  assert.match(source, /catch \{\s*toast\.error\('Não foi possível copiar a mensagem/);
  assert.match(source, /disabled=\{valorInvalido\}/);
  assert.match(source, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
});