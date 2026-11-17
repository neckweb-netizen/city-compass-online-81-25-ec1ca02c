import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117140328_optimize_auth_lookup_for_session_and_admin_reads.sql',import.meta.url),'utf8');

test('admin/session auth initplan migration has strict policy guards and only selected tables', () => {
  assert.match(sql, /IF n<>8 THEN RAISE EXCEPTION/);
  assert.match(sql, /tablename='user_sessions'/);
  assert.match(sql, /tablename='avisos_sistema'/);
  assert.match(sql, /tablename='canal_informativo'/);
  assert.match(sql, /replace\(target.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql, /replace\(target.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.doesNotMatch(sql, /DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
});

test('migration preserves original policy names and uses atomic transaction', () => {
  for (const policy of [
    'Admins podem ver todas as sessões','Admins podem ver todas sessões',
    'Usuários podem atualizar suas sessões','Usuários podem criar suas sessões',
    'Usuários podem excluir suas sessões','Usuários podem ver suas sessões',
    'Admins podem gerenciar avisos','Admins podem gerenciar canal informativo',
  ]) assert.ok(sql.includes(policy),policy);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
});
