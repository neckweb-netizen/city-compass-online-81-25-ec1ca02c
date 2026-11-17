import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117142623_optimize_admin_company_role_rls_auth_initplans.sql', import.meta.url), 'utf8');

test('four admin RLS policies are optimized without altering authorization', () => {
  assert.match(sql, /IF n<>4 THEN RAISE EXCEPTION/);
  for (const name of [
    'Admin cidade pode gerenciar empresas de sua cidade',
    'Admin geral pode gerenciar todas as empresas',
    'Admin geral can manage all roles',
    'Admins can view all roles',
  ]) assert.ok(sql.includes(name), name);
  assert.match(sql, /target.role_set <> '\{authenticated\}'/);
  assert.match(sql, /replace\(target.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql, /replace\(target.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.doesNotMatch(sql, /DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
});
