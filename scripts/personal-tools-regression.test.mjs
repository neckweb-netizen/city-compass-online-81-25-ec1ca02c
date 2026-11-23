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
    writeFileSync(output, source.replace('export const parseBrazilianNumber = (input: string): number | null =>', 'const parseBrazilianNumber = (input) =>').replace('let normalized: string;', 'let normalized;') + '\nconsole.log(JSON.stringify(["1.234,56","1234,56","6.19","1.000","abc","-2","1.2.3"].map(parseBrazilianNumber)));');
    const values = JSON.parse(execFileSync(process.execPath, [output], { encoding: 'utf8' }));
    assert.deepEqual(values, [1234.56,1234.56,6.19,1000,null,null,null]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('calculators use localized number parsing without masking bad budget or comparison input', () => {
  const fuel = read('src/pages/ferramentas/CalculadoraCombustivel.tsx');
  const comparison = read('src/pages/ferramentas/ComparadorPrecos.tsx');
  const budget = read('src/pages/ferramentas/CalculadoraOrcamento.tsx');
  assert.match(fuel, /parseBrazilianNumber\(value\) \?\? 0/);
  assert.match(comparison, /parseBrazilianNumber\(value\)/);
  assert.match(comparison, /const valid = price !== null && price > 0 && quantity !== null && quantity > 0/);
  assert.match(comparison, /bestItems\.length > 1/);
  assert.match(budget, /parseBrazilianNumber\(value\)/);
  assert.match(budget, /const entradasValidas =/);
  assert.match(budget, /impostosLidos !== null && impostosLidos >= 0 && impostosLidos < 100/);
  assert.match(budget, /precoTotalProjeto = entradasValidas/);
});

test('finance storage resets on account switch even when new account has empty cache', () => {
  const storage = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.match(storage, /const accountCache = loadLocalState\(userStorageKey\(user\.id\)\);\s*\/\/ Sempre descarte[\s\S]*?setState\(accountCache\);/);
  assert.doesNotMatch(storage, /if \(isMeaningfulState\(accountCache\)\) setState\(accountCache\)/);
  assert.match(storage, /if \(!user\) \{\s*loadedUserRef\.current = null;\s*setState\(loadLocalState\(FINANCE_STORAGE_KEY\)\)/);
});

test('finance deletion is atomic, limited to authenticated owner and only clears cache after success', () => {
  const hook = read('src/hooks/useControleFinanceiroStorage.ts');
  const sql = read('supabase/migrations/20261122151000_atomic_finance_account_clear.sql');
  assert.match(hook, /supabase\.rpc\('clear_finance_account_data' as any\)/);
  assert.doesNotMatch(hook, /Promise\.all\(\[\s*\(supabase as any\)\.from\('finance_lancamentos'\)\.delete/);
  assert.match(hook, /if \(error\) \{\s*setSyncError\(error\.message\);/);
  assert.match(hook, /persistLocal\(EMPTY_FINANCE_STATE\);\s*try \{\s*localStorage\.removeItem\(userStorageKey\(requestedUserId\)\)/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /delete from public\.finance_lancamentos where user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /delete from public\.finance_configuracoes where user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /revoke all on function public\.clear_finance_account_data\(\) from public, anon/);
});

test('backup restore is one authenticated transaction and never deletes prior data on a failed request', () => {
  const hook = read('src/hooks/useControleFinanceiroStorage.ts');
  const sql = read('supabase/migrations/20261122163000_atomic_finance_backup_restore.sql');
  const page = read('src/pages/ferramentas/ControleFinanceiro.tsx');
  assert.match(hook, /supabase\.rpc\('restore_finance_account_data' as any/);
  assert.doesNotMatch(hook, /const obsoleteIds =/);
  assert.match(hook, /if \(restoreInProgressRef\.current \|\| accountOperationRef\.current\)/);
  assert.match(hook, /if \(activeUserIdRef\.current !== requestedUserId\)/);
  assert.match(hook, /persistLocal\(next\);\s*setHasLocalDataToImport\(false\)/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /create or replace function public\.restore_finance_account_data/);
  assert.match(sql, /on conflict \(id\) do update/);
  assert.match(sql, /delete from public\.finance_lancamentos/);
  assert.match(sql, /revoke all on function public\.restore_finance_account_data\(jsonb,jsonb\) from public, anon/);
  assert.match(page, /Restauração não concluída\. Seus dados anteriores foram preservados/);
});

test('individual finance mutations are serialized and never claim remote success before confirmation', () => {
  const hook = read('src/hooks/useControleFinanceiroStorage.ts');
  const page = read('src/pages/ferramentas/ControleFinanceiro.tsx');
  assert.match(hook, /const accountOperationRef = useRef\(false\)/);
  assert.match(hook, /if \(accountOperationRef\.current \|\| authLoading \|\| loading \|\| stateAccountId !== \(user\?\.id \?\? null\)\) return operationBlocked\(\)/);
  assert.match(hook, /if \(activeUserIdRef\.current !== accountId\)/);
  assert.match(hook, /const \{ error \} = await mutate\(accountId\)/);
  assert.match(hook, /persistLocal\(next\);\s*return \{ synced: true as const \}/);
  assert.match(hook, /return runFinanceMutation\(next, accountId =>/);
  assert.match(hook, /\.eq\('user_id', accountId\)/);
  assert.match(page, /toast\.success\(result\.synced \? 'Planejamento salvo na sua conta\.'/);
  assert.doesNotMatch(page, /toast\.success\(editing \? 'Lançamento atualizado\.' : user/);
  assert.doesNotMatch(page, /toast\.success\(user \? 'Planejamento salvo na sua conta\.'/);
});

test('financial forms stay open after server errors and confirm success after persistence', () => {
  const page = read('src/pages/ferramentas/ControleFinanceiro.tsx');
  assert.match(page, /if \(result\.reason === 'remote_error'\) \{[\s\S]*?toast\.error\([\s\S]*?return;\s*\}/);
  assert.match(page, /setIsEntryOpen\(false\);/);
  assert.match(page, /setIsSettingsOpen\(false\);/);
  assert.match(page, /if \(syncing \|\| financeLoading\) return/);
});


test('legacy finance data never becomes account cache before explicit import', () => {
  const storage = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.match(storage, /else if \(localHasData\) \{[\s\S]*?persistLocal\(remoteState\);\s*setHasLocalDataToImport\(true\);/);
  assert.doesNotMatch(storage, /persistLocal\(legacyLocalRef\.current\)/);
  assert.match(storage, /const result = await replaceAll\(legacyLocalRef\.current\)/);
  assert.match(storage, /if \(!hasLocalDataToImport\) return operationBlocked\(\)/);
});


test('finance data is hidden immediately when session owner changes', () => {
  const storage = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.match(storage, /const \[stateAccountId, setStateAccountId\] = useState<string \| null>\(null\)/);
  assert.match(storage, /setState\(accountCache\);\s*setStateAccountId\(user\.id\)/);
  assert.match(storage, /const visibleState = stateAccountId === \(user\?\.id \?\? null\) \? state : EMPTY_FINANCE_STATE/);
  assert.match(storage, /state: visibleState/);
  assert.match(storage, /loading: authLoading \|\| loading \|\| stateAccountId !== \(user\?\.id \?\? null\)/);
});


test('finance mutations, restore and deletion wait for current account to finish loading', () => {
  const hook = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.ok((hook.match(/accountOperationRef\.current \|\| authLoading \|\| loading \|\| stateAccountId !== \(user\?\.id \?\? null\)/g) || []).length >= 2);
  assert.match(hook, /restoreInProgressRef\.current \|\| accountOperationRef\.current \|\| authLoading \|\| loading \|\| stateAccountId !== \(user\?\.id \?\? null\)/);
  assert.match(hook, /if \(activeUserIdRef\.current === requestedUserId\) setSyncError\(error\.message\)/);
});


test('unexpected finance loading errors do not leave the interface stuck', () => {
  const hook = read('src/hooks/useControleFinanceiroStorage.ts');
  assert.match(hook, /void loadRemote\(\)\.catch\(\(cause\) => \{/);
  assert.match(hook, /if \(cancelled \|\| activeUserIdRef\.current !== user\.id\) return/);
  assert.match(hook, /setSyncError\(cause instanceof Error \? cause\.message : 'Falha de conexão ao carregar dados financeiros\.'\)/);
  assert.match(hook, /setLoading\(false\)/);
});
