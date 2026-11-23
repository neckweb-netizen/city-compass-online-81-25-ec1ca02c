import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = readFileSync(new URL('../src/pages/ferramentas/CicloMenstrual.tsx', import.meta.url), 'utf8');

test('cycle diary never overwrites unreadable stored records', () => {
  assert.match(page, /setStorageError\(true\);\s*\/\/ Não sobrescreva dados antigos/);
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
