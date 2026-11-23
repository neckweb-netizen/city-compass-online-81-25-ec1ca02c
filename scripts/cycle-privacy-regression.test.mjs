import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = readFileSync(new URL('../src/pages/ferramentas/CicloMenstrual.tsx', import.meta.url), 'utf8');

test('cycle diary never overwrites unreadable stored records', () => {
  assert.match(page, /setStorageError\(true\);\s*setStorageReadFailed\(true\);\s*\/\/ Não sobrescreva dados antigos/);
  assert.match(page, /if \(!loaded \|\| storageReadFailed\) return/);
  assert.match(page, /setStorageReadFailed\(true\)/);
});

test('cycle diary handles local storage write and deletion errors', () => {
  assert.match(page, /try \{\s*localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(payload\)\)/);
  assert.match(page, /try \{\s*localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(page, /role="alert"/);
});

test('cycle backup download delays URL revocation', () => {
  assert.match(page, /window\.setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 60_000\)/);
});

test('cycle diary permits retry after a failed write without dismissing unreadable-data protection', () => {
  assert.match(page, /const \[saveRetry, setSaveRetry\] = useState\(0\)/);
  assert.match(page, /setSaveRetry\(\(current\) => current \+ 1\)/);
  assert.match(page, /!storageReadFailed && \(/);
});


test('explicit deletion unlocks the read-failure guard only after removing stored data', () => {
  assert.match(page, /try \{\s*localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(page, /setStorageReadFailed\(false\);\s*setStorageError\(false\);\s*setSettings\(DEFAULT_SETTINGS\)/);
});

test('backup export handles errors and always releases its temporary link', () => {
  assert.match(page, /try \{\s*const data: StoredData = \{ settings, periods, logs \}/);
  assert.match(page, /finally \{\s*anchor\.remove\(\)/);
  assert.match(page, /Não foi possível preparar o backup/);
});
