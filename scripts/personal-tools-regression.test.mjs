import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const read = relative => readFileSync(new URL('../' + relative, import.meta.url), 'utf8');

test('Brazilian numeric parsing handles thousands, decimal commas and rejects invalid values', () => {
  const source = read('src/lib/parseBrazilianNumber.ts');
  const directory = mkdtempSync(path.join(tmpdir(), 'saj-number-'));
  try {
    const output = path.join(directory, 'parser.mjs');
    writeFileSync(output, source.replace('export const parseBrazilianNumber = (input: string): number | null =>', 'const parseBrazilianNumber = (input) =>') + '\nconsole.log(JSON.stringify(["1.234,56","1234,56","6.19","1.000","abc","-2","1.2.3"].map(parseBrazilianNumber)));');
    const values = JSON.parse(execFileSync(process.execPath, [output], { encoding: 'utf8' }));
    assert.deepEqual(values, [1234.56,1234.56,6.19,1000,null,null,null]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('calculators share the same localized number parser', () => {
  for (const file of ['CalculadoraCombustivel.tsx', 'ComparadorPrecos.tsx', 'CalculadoraOrcamento.tsx']) {
    const page = read('src/pages/ferramentas/' + file);
    assert.match(page, /parseBrazilianNumber\(value\) \?\? 0/);
  }
});

test('finance storage resets on account switch even when new account has empty cache', () => {
  const storage = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.match(storage, /const accountCache = loadLocalState\(userStorageKey\(user\.id\)\);\s*\/\/ Sempre descarte[\s\S]*?setState\(accountCache\);/);
  assert.doesNotMatch(storage, /if \(isMeaningfulState\(accountCache\)\) setState\(accountCache\)/);
  assert.match(storage, /if \(!user\) \{\s*loadedUserRef\.current = null;\s*setState\(loadLocalState\(FINANCE_STORAGE_KEY\)\)/);
});
