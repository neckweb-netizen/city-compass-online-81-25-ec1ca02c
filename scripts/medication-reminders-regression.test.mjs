import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('medicine account caches are isolated, and stale remote requests cannot overwrite a new session',()=>{
  const s=read('src/hooks/useMedicamentosStorage.ts');
  assert.match(s,/const keyFor = \(id\?:string\) => id \?/);
  assert.match(s,/const activeAccountRef=useRef\(user\?\.id\?\?null\)/);
  assert.match(s,/if\(request!==requestRef\.current\|\|activeAccountRef\.current!==accountId\)return/);
  assert.match(s,/const visible=stateAccountId===\(user\?\.id\?\?null\)\?state:empty/);
  assert.match(s,/if\(authLoading\|\|loading\|\|mutationRef\.current\|\|stateAccountId!==\(user\?\.id\?\?null\)\|\|syncError\?\.startsWith\('Existem dados locais'\)\)return blocked\(\)/);
});
test('schedule mutation is atomic and limited to authenticated owner',()=>{
  const s=read('src/hooks/useMedicamentosStorage.ts');
  const sql=read('supabase/migrations/20261122183500_medicine_schedule_atomic_update.sql');
  assert.match(s,/supabase\.rpc\('save_medicine_with_schedule' as any/);
  assert.match(s,/if\(error\)\{\s*if\(activeAccountRef\.current===accountId\)/);
  assert.match(s,/persist\(next,accountId\);\s*return\{synced:true as const\}/);
  assert.match(sql,/security invoker/);
  assert.match(sql,/on conflict \(id\) do update/);
  assert.match(sql,/delete from public\.medicamento_horarios/);
  assert.match(sql,/revoke all on function public\.save_medicine_with_schedule\(jsonb,jsonb\) from public, anon/);
  assert.doesNotMatch(sql,/delete from public\.medicamento_doses/);
});
test('medicine UI reports real server errors and avoids duplicate dose logging',()=>{
  const page=read('src/pages/ferramentas/MedicamentosLembretes.tsx');
  const s=read('src/hooks/useMedicamentosStorage.ts');
  assert.match(page,/if\(r\.reason==='remote_error'\)\{toast\.error\(/);
  assert.match(page,/if\(result\.reason==='remote_error'\)\{toast\.error\(/);
  assert.match(page,/disabled=\{syncing\|\|doses\.some/);
  assert.match(page,/m\.dataInicio<=/);
  assert.match(s,/Este horário já possui uma dose registrada/);
});


test('legacy medicine records can be exported privately and are not auto-linked to a new account',()=>{
  const hook=read('src/hooks/useMedicamentosStorage.ts');
  const page=read('src/pages/ferramentas/MedicamentosLembretes.tsx');
  assert.match(hook,/const legacyData = readLocal\(KEY\)/);
  assert.match(hook,/const exportBackup = \(legacy:boolean\) =>/);
  assert.match(hook,/if \(!legacy && !user\?\.id\) return false/);
  assert.match(hook,/if\(!hasRemote&&hasCached\)\{/);
  assert.match(hook,/setSyncError\('Existem dados locais não confirmados na conta/);
  assert.match(page,/Baixar dados antigos/);
  assert.match(page,/Baixar dados da conta/);
  assert.match(page,/O arquivo contém informações de saúde/);
  assert.doesNotMatch(hook,/localStorage\.removeItem\(KEY\)/);
});
