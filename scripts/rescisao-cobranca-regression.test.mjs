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

test('billing management reuses validated manual billing without losing its own banner', () => {
  const billing = read('src/pages/ferramentas/GeradorCobranca.tsx');
  const management = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  assert.match(billing, /bannerSecao = 'gerador_cobranca'/);
  assert.match(billing, /<ToolBanner secao=\{bannerSecao\} \/>/);
  assert.match(management, /<GeradorCobranca bannerSecao="gestao_cobrancas"\s*\/>/);
  assert.match(management, /cobrancasStorageKey\(account\)/);
  assert.match(management, /localStorage\.setItem\(cobrancasSyncCacheKey\(account\), JSON\.stringify\(next\)\)/);
  assert.match(management, /supabase\.rpc\('save_crm_caderno_for_user' as any/);
  assert.match(management, /p_expected_revision: revision, p_dados: next, p_expected_user: account/);
  assert.match(management, /if \(!nextRevision \|\| Number\(nextRevision\) <= 0\)/);
  assert.match(management, /if \(await persist\(/);
  assert.match(management, /activeAccountRef\.current !== requestedAccount/);
  assert.match(management, /validarBackupCobrancas\(JSON\.parse\(await file\.text\(\)\)\)/);
  assert.match(management, /status: paid \? \('paga' as const\) : \('pendente' as const\)/);
  assert.match(management, /telefoneWhatsapp\(customer\?\.telefone \?\? ''\)/);
  assert.doesNotMatch(management, /navigator\.clipboard\.writeText/);
});


test('micro CRM waits for server confirmation and imports legacy data only after consent', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  const schema = read('src/features/cobrancas/microCrm.ts');
  assert.match(page, /const load = async \(\) => \{/);
  assert.match(page, /supabase\.from\('crm_cadernos' as any\)/);
  assert.match(page, /if \(error\) throw error/);
  assert.match(page, /setLegacy\(backup\)/);
  assert.match(page, /if \(!window\.confirm\('Importar este backup local/);
  assert.match(page, /if \(await persist\(snapshot\)\)/);
  assert.match(page, /if \(activeAccountRef\.current !== requestedAccount\) return/);
  assert.match(page, /&& await persist\(/);
  assert.match(schema, /function validarBackupCobrancas\(input: unknown\)/);
});


test('unreadable local CRM backups do not block remote data or get overwritten', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  assert.match(page, /setLocalStorageWarning\('A cópia deste aparelho não pôde ser lida/);
  assert.match(page, /const \{ data: row, error \} = await supabase\.from\('crm_cadernos' as any\)/);
  assert.match(page, /if \(!localStorageWarning && \(!legacy \|\| JSON\.stringify\(legacy\) === JSON\.stringify\(next\)\)\)/);
  assert.match(page, /role="alert"/);
});

test('CRM allows explicit reload after version conflicts and across devices', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  assert.match(page, /Recarregar caderno/);
  assert.match(page, /Atualizar dados de outros aparelhos/);
  assert.match(page, /window\.location\.reload\(\)/);
  assert.match(page, /if \(activeAccountRef\.current !== account\) return false/);
});


test('CRM preserves the rejected snapshot as a downloadable file before resolving a conflict', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  assert.match(page, /setConflictDraft\(\{ account, snapshot: next \}\)/);
  assert.match(page, /const exportConflict = \(\) => \{/);
  assert.match(page, /conflictDraft\?\.account !== uid/);
  assert.match(page, /downloadSnapshot\(conflictDraft\.snapshot, 'sajtem-cobrancas-alteracoes-nao-salvas-'/);
  assert.match(page, /Baixar alterações não salvas/);
  assert.match(page, /setConflictDraft\(null\)/);
});


test('legacy records are never overwritten by synced cache data', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  const model = read('src/features/cobrancas/microCrm.ts');
  assert.match(model, /export const cobrancasStorageKey =/);
  assert.match(model, /export const cobrancasSyncCacheKey =/);
  assert.match(page, /localStorage\.getItem\(cobrancasStorageKey\(account\)\)/);
  assert.match(page, /localStorage\.getItem\(cobrancasSyncCacheKey\(account\)\)/);
  assert.match(page, /JSON\.stringify\(backup\) !== JSON\.stringify\(previousSynced\)/);
  assert.match(page, /localStorage\.setItem\(cobrancasSyncCacheKey\(account\), JSON\.stringify\(next\)\)/);
  assert.doesNotMatch(page, /localStorage\.setItem\(cobrancasStorageKey\(account\)/);
});


test('CRM writes require owner-scoped versioned RPC, never direct authenticated table writes', () => {
  const sql = read('supabase/migrations/20261123183000_crm_exclusive_versioned_writes.sql');
  assert.match(sql, /security definer set search_path = ''/);
  assert.match(sql, /v_user := \(select auth\.uid\(\)\)/);
  assert.match(sql, /where user_id = v_user and revision = p_expected_revision/);
  assert.match(sql, /on conflict\(user_id\) do nothing/);
  assert.match(sql, /revoke insert, update, delete on public\.crm_cadernos from authenticated, anon, public/);
  assert.match(sql, /revoke all on function public\.save_crm_caderno\(bigint,jsonb\) from public, anon/);
  assert.match(sql, /grant execute on function public\.save_crm_caderno\(bigint,jsonb\) to authenticated/);
});


test('CRM RPC binds writes to the same account from which the operation started', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  const sql = read('supabase/migrations/20261123224000_crm_bind_save_to_account.sql');
  const revoke = read('supabase/migrations/20261123225500_crm_revoke_legacy_save_rpc.sql');
  assert.match(page, /p_expected_user: account/);
  assert.match(sql, /v_user <> p_expected_user/);
  assert.match(sql, /where user_id=v_user and revision=p_expected_revision/);
  assert.match(sql, /on conflict\(user_id\) do nothing/);
  assert.match(sql, /revoke all on function public\.save_crm_caderno_for_user\(bigint,jsonb,uuid\) from public,anon/);
  assert.match(revoke, /revoke execute on function public\.save_crm_caderno\(bigint,jsonb\) from authenticated/);
});


test('imported legacy backup is recognized without copying personal data or reimporting', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  const model = read('src/features/cobrancas/microCrm.ts');
  assert.match(model, /export const cobrancasImportedLegacyKey/);
  assert.match(model, /crypto\.subtle\.digest\('SHA-256', bytes\)/);
  assert.match(page, /importedFingerprint === await legacyBackupFingerprint\(backup\)/);
  assert.match(page, /backup && !alreadyImported &&/);
  assert.match(page, /localStorage\.setItem\(cobrancasImportedLegacyKey\(importAccount\), fingerprint\)/);
  assert.doesNotMatch(page, /localStorage\.setItem\(cobrancasStorageKey\(account\)/);
});


test('successful import never reappears in the current session, even when local metadata fails', () => {
  const page = read('src/pages/ferramentas/GestaoCobrancas.tsx');
  assert.match(page, /const importAccount = uid/);
  assert.match(page, /if \(activeAccountRef\.current !== importAccount\) return/);
  assert.match(page, /if \(await persist\(snapshot\)\) \{/);
  assert.match(page, /setLegacy\(null\);\s*try \{\s*const fingerprint = await legacyBackupFingerprint\(snapshot\)/);
  assert.match(page, /backup antigo pode reaparecer após recarregar/);
});
