import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117150638_optimize_owner_and_admin_rls_eight_policies.sql', import.meta.url), 'utf8');

test('eight owner/moderation RLS policies keep their authorization predicates', () => {
  for (const name of [
    'Admins podem excluir avaliações',
    'Admins podem gerenciar categorias',
    'Admins podem moderar comentários',
    'Admins podem gerenciar enquetes',
    'Empresas podem atualizar seus eventos',
    'Admins podem gerenciar ordem das seções',
    'Empresas podem atualizar seus próprios produtos',
    'Proprietários podem gerenciar seus serviços',
  ]) assert.ok(sql.includes(name), name);
  assert.match(sql, /processed<>8/);
  assert.match(sql, /replace\(rec.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql, /replace\(rec.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql, /rec.role_set='\{public\}' AND rec.tablename NOT IN \('avaliacoes','eventos'\)/);
  assert.match(sql, /statement_sql:=statement_sql\|\|' TO authenticated'/);
  assert.doesNotMatch(sql, /DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
});
