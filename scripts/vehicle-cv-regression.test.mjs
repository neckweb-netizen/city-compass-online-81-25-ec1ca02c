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
  assert.ok((page.match(/if \(result\.reason === 'remote_error'\) return toast\.error\(/g)||[]).length >= 4);
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


test('fuel and odometer update atomically for the authenticated owner', () => {
  const hook = read('src/hooks/useMeuVeiculoStorage.ts');
  const sql = read('supabase/migrations/20261122181700_atomic_vehicle_fuel_and_mileage.sql');
  assert.match(hook, /supabase\.rpc\('save_vehicle_fuel_atomic' as any/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /for update/);
  assert.match(sql, /on conflict \(id\) do update/);
  assert.match(sql, /quilometragem_atual=greatest\(quilometragem_atual,km\)/);
  assert.match(sql, /grant execute on function public\.save_vehicle_fuel_atomic\(jsonb\) to authenticated/);
});


test('legacy vehicle recovery requires confirmation and preserves old backup', () => {
  const hook = read('src/hooks/useMeuVeiculoStorage.ts');
  const page = read('src/pages/ferramentas/MeuVeiculo.tsx');
  const sql = read('supabase/migrations/20261122183000_vehicle_legacy_opt_in_import.sql');
  assert.match(hook, /const legacyBackup = readLocal\(\)/);
  assert.match(hook, /const importLegacyBackup = useCallback\(async/);
  assert.match(hook, /supabase\.rpc\('import_legacy_vehicle_backup' as any/);
  assert.doesNotMatch(hook, /localStorage\.removeItem\(LOCAL_KEY\)/);
  assert.match(page, /window\.confirm\(/);
  assert.match(page, /Baixar backup antigo/);
  assert.match(page, /Importar para minha conta/);
  assert.match(page, /if \(!user \|\| syncing \|\| loading \|\| !legacyCount\) return/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /on conflict \(id\) do nothing/g);
  assert.match(sql, /revoke all on function public\.import_legacy_vehicle_backup\(jsonb\) from public,anon/);
  assert.doesNotMatch(sql, /\bdelete from public\./);
  assert.doesNotMatch(sql, /on conflict \(id\) do update/);
});

test('vehicle date defaults use the local calendar day, not UTC', () => {
  const page = read('src/pages/ferramentas/MeuVeiculo.tsx');
  assert.match(page, /getTimezoneOffset\(\) \* 60_000/);
  assert.match(page, /localDate\.toISOString\(\)\.slice\(0, 10\)/);
});

test('vehicle CI also watches changes to the atomic fuel migration', () => {
  const workflow = read('.github/workflows/vehicle-cv-regression.yml');
  assert.match(workflow, /supabase\/migrations\/\*atomic_vehicle_fuel\*/);
});
