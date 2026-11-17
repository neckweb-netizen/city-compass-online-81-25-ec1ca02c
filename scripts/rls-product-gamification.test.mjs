import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117153344_optimize_ten_company_events_gamification_admin_rls.sql',import.meta.url),'utf8');

test('ten product, gamification and administrative policies preserve authorization',()=>{
 const names=[
  'Admins podem gerenciar badges',
  'Admins podem ver conversões',
  'Usuários podem ver seus próprios eventos',
  'Admins podem gerenciar níveis',
  'Admins podem gerenciar missões',
  'Empresas podem criar seus próprios produtos',
  'Empresas podem excluir seus próprios produtos',
  'Admins podem ver jornadas',
  'Usuários podem ver seus pontos',
  'Admins podem ver todos os eventos',
 ];
 for(const name of names) assert.ok(sql.includes(name),name);
 assert.match(sql,/processed<>10/);
 assert.match(sql,/rec.role_set <> '\{authenticated\}'/);
 assert.match(sql,/replace\(rec.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
 assert.match(sql,/replace\(rec.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
 assert.doesNotMatch(sql,/DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
 assert.match(sql,/BEGIN;/);
 assert.match(sql,/COMMIT;/);
});
