import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117152711_optimize_owner_favorites_votes_follows_missions_rls.sql',import.meta.url),'utf8');

test('owner-only RLS policies stay scoped and retain authorization predicates', () => {
  assert.match(sql,/n<>14 OR public_count<>4/);
  assert.match(sql,/replace\(rec.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql,/replace\(rec.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql,/rec.role_set='\{public\}' AND rec.tablename NOT IN \('favoritos','user_missions'\)/);
  assert.match(sql,/stmt:=stmt\|\|' TO authenticated'/);
  for (const table of ['favoritos','seguidores_problema','user_missions','votos_comentario','votos_problema'])
    assert.ok(sql.includes("tablename='"+table+"'"));
  assert.doesNotMatch(sql,/DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
  assert.match(sql,/BEGIN;/);
  assert.match(sql,/COMMIT;/);
});
