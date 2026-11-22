import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('pregnancy diary and schedule are isolated per account and stale loads are ignored',()=>{
  const hook=read('src/hooks/useGestacaoStorage.ts');
  assert.match(hook,/const accountRef = useRef\(user\?\.id \?\? null\)/);
  assert.match(hook,/const sequenceRef = useRef\(0\)/);
  assert.match(hook,/if \(cancelled \|\| sequence !== sequenceRef\.current \|\| accountRef\.current !== accountId\) return/);
  assert.match(hook,/const visible = stateAccountId === \(user\?\.id \?\? null\) \? state : EMPTY_STATE/);
  assert.match(hook,/persist\(next, accountId\);\s*return \{ synced: true as const \}/);
});
test('sensitive gestation forms preserve entries on errors and validate dates',()=>{
  const page=read('src/pages/ferramentas/AcompanhamentoGestacional.tsx');
  assert.match(page,/if \(reportFailure\(result\)\) return/);
  assert.match(page,/isValid\(parseISO\(required\)\)/);
  assert.match(page,/parseBrazilianNumber\(diarioForm\.peso\)/);
  assert.match(page,/if \(loading \|\| syncing\) return/);
  assert.match(page,/window\.confirm\('Excluir este registro do diário\?'\)/);
});
test('unknown local gestation records are not silently overwritten by empty cloud data',()=>{
  const hook=read('src/hooks/useGestacaoStorage.ts');
  assert.match(hook,/if \(!hasRemote && hasCached\) \{/);
  assert.match(hook,/setSyncError\('Há dados antigos neste aparelho/);
  assert.match(hook,/if \(accountRef\.current !== accountId\)/);
});


test('gestation private local backups remain available and draft forms reset on account change',()=>{
 const hook=read('src/hooks/useGestacaoStorage.ts');
 const page=read('src/pages/ferramentas/AcompanhamentoGestacional.tsx');
 assert.match(hook,/const exportLocalBackup = \(legacy: boolean\) =>/);
 assert.match(hook,/if \(!legacy && !user\?\.id\) return false/);
 assert.match(hook,/const accountBackupAvailable = Boolean\(user\?\.id\)/);
 assert.match(page,/Baixar dados antigos/);
 assert.match(page,/Baixar dados desta conta/);
 assert.match(page,/O arquivo contém informações de saúde/);
 assert.match(page,/setProfileForm\(\{ dum: '', dpp: '', metodoCalculo: 'dum'/);
 assert.match(page,/\}, \[user\?\.id\]\)/);
});
