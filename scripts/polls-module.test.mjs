import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('poll voting validates login, choices, uniqueness and serializes by user', () => {
  const sql = source('supabase/migrations/20261120210000_secure_poll_votes.sql');
  assert.match(sql, /v_usuario is null/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /cardinality\(opcoes_indices\) = 0/);
  assert.match(sql, /not v_multipla and cardinality\(opcoes_indices\) <> 1/);
  assert.match(sql, /count\(distinct x\.indice\)/);
  assert.match(sql, /r\.usuario_id = v_usuario/);
  assert.match(sql, /revoke execute on function public\.votar_enquete/);
  assert.match(sql, /grant execute on function public\.votar_enquete.*to authenticated/);
});

test('poll choices cannot be changed after votes exist', () => {
  const sql = source('supabase/migrations/20261120211000_protect_poll_results_integrity.sql');
  assert.match(sql, /new\.opcoes is distinct from old\.opcoes/);
  assert.match(sql, /new\.multipla_escolha is distinct from old\.multipla_escolha/);
  assert.match(sql, /exists \(select 1 from public\.respostas_enquete/);
});

test('poll home explains login and prevents rapid duplicate votes', () => {
  const page = source('src/components/home/EnqueteSection.tsx');
  assert.match(page, /if \(!user\) \{ setAuthOpen\(true\); return; \}/);
  assert.match(page, /votingRef\.current = true/);
  assert.match(page, /finally \{\s*votingRef\.current = false;/);
  assert.match(page, /await votarEnquete\.mutateAsync\(\{ enqueteId: pollId, opcoes: choices \}\)/);
  assert.match(page, /currentAccountRef\.current === account && currentPollRef\.current === pollId/);
  assert.match(page, /new Set\(selectedOpcoes\)\.size !== selectedOpcoes\.length/);
  assert.match(page, /previous\.includes\(opcaoIndex\) \? previous/);
  assert.match(page, /<AuthDialog open=\{authOpen\}/);
  assert.match(page, /refetchActive/);
  assert.match(page, /setSelectedOpcoes\(\[\]\)/);
});

test('poll hook no longer sends client IP or browser fingerprint', () => {
  const hook = source('src/hooks/useEnquetes.tsx');
  assert.doesNotMatch(hook, /api\.ipify\.org/);
  assert.doesNotMatch(hook, /navigator\.userAgent/);
  assert.match(hook, /ip_param: null/);
  assert.match(hook, /user_agent_param: null/);
  assert.match(hook, /if \(!removed\) throw new Error/);
  assert.match(hook, /if \(!data\) throw new Error\('Enquete não encontrada/);
});

test('poll admin validates dates and unique alternatives and blocks overlapping operations', () => {
  const page = source('src/components/admin/sections/EnquetesSection.tsx');
  assert.match(page, /new Set\(opcoesFiltradas\.map/);
  assert.match(page, /opcoesFiltradas\.length > 20/);
  assert.match(page, /fim <= inicio/);
  assert.match(page, /submittingRef\.current/);
  assert.match(page, /isAdminError/);
  assert.match(page, /refetchAdmin/);
  assert.match(page, /disabled=\{isProcessing\}/);
});
