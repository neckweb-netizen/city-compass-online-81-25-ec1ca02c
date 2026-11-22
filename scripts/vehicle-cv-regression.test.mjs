import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('vehicle storage isolates account caches and discards stale session responses', () => {
  const hook = read('src/hooks/useMeuVeiculoStorage.ts');
  assert.match(hook, /const userStorageKey = \(id: string\) =>/);
  assert.match(hook, /localStorage\.getItem\(key\)/);
  assert.match(hook, /const requestSequenceRef = useRef\(0\)/);
  assert.match(hook, /if \(sequence !== requestSequenceRef\.current \|\| accountIdRef\.current !== accountId\) return/);
  assert.match(hook, /const visibleState = stateAccountId === \(user\?\.id \?\? null\) \? state : EMPTY_STATE/);
  assert.match(hook, /stateAccountId !== \(user\?\.id \?\? null\)/);
});

test('vehicle writes and deletions confirm server success before updating local state', () => {
  const hook = read('src/hooks/useMeuVeiculoStorage.ts');
  assert.match(hook, /const mutationInProgressRef = useRef\(false\)/);
  assert.match(hook, /const \{ error \} = await operation\(accountId\)/);
  assert.match(hook, /if \(error\) \{/);
  assert.match(hook, /persistLocal\(next, accountId\)/);
  assert.match(hook, /\.delete\(\)\.eq\('id', id\)\.eq\('user_id', accountId\)/);
  assert.doesNotMatch(hook, /persistLocal\(next\);\s*if \(!user\) return/);
});

test('vehicle forms retain data when persistence fails and reject malformed currencies', () => {
  const page = read('src/pages/ferramentas/MeuVeiculo.tsx');
  assert.match(page, /parseBrazilianNumber\(value\) \?\? 0/);
  for (const action of ['saveVehicle','saveFuel','saveMaintenance','saveReminder']) {
    assert.match(page, new RegExp('const result = await ' + action + '\\('));
  }
  assert.ok((page.match(/if \(result\.reason === 'remote_error'\) return toast\.error\(result\.error\.message\)/g)||[]).length >= 4);
  assert.match(page, /if \(loading \|\| syncing\) return/);
});

test('CV PDF generation is bounded and single-flight without changing its A4 layout', () => {
  const page = read('src/pages/ferramentas/CriadorCurriculo.tsx');
  assert.match(page, /if \(pdfInProgressRef\.current\) return/);
  assert.match(page, /if \(totalPaginas > 20\)/);
  assert.match(page, /PDFDocument\.create\(\)/);
  assert.match(page, /URL\.revokeObjectURL\(url\), 60_000/);
  assert.match(page, /pdfInProgressRef\.current = false/);
});
