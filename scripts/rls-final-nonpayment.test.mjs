import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117161746_optimize_remaining_nonpayment_rls_ten_policies.sql',import.meta.url),'utf8');

test('ten nonpayment policy optimizations preserve owner/admin guards and public raffle links',()=>{
 const policies=[
  'Admins podem gerenciar achados e perdidos',
  'Empresas podem responder avaliações',
  'Apenas admins podem alterar configuracoes',
  'Empresas podem gerenciar seus cupons',
  'Empresas podem gerenciar seus endereços',
  'estatisticas_auth_policy','leaderboard_cache_auth_policy',
  'Empresas podem gerenciar seus produtos',
  'Usuários podem ver suas próprias rifas',
  'Empresas podem gerenciar seus serviços',
 ];
 for(const policy of policies) assert.ok(sql.includes(policy),policy);
 assert.match(sql,/processed<>10 OR public_count<>2/);
 assert.match(sql,/replace\(rec.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
 assert.match(sql,/replace\(rec.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
 assert.match(sql,/IF rec.tablename='avaliacoes' THEN stmt:=stmt\|\|' TO authenticated'/);
 assert.doesNotMatch(sql,/IF rec.tablename='rifas_usuarios' THEN stmt:=stmt\|\|' TO authenticated'/);
 assert.doesNotMatch(sql,/DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
});
