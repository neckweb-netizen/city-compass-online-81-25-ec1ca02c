import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');

test('autonomous services enforce authenticated creator ownership instead of any logged in user', () => {
 const sql=source('supabase/migrations/20261117131304_enforce_autonomo_service_creator_ownership.sql');
 assert.match(sql,/ALTER POLICY "Usuários podem criar serviços" ON public\.servicos_autonomos WITH CHECK \(\(select auth\.uid\(\)\) = usuario_id\)/);
 assert.match(sql,/Unexpected insert policy/);
 assert.doesNotMatch(sql,/ALTER POLICY "Admins podem gerenciar todos os serviços"/);
 assert.doesNotMatch(sql,/OR \(\(select auth\.uid\(\)\) IS NOT NULL\)/);
});

test('public services remain readable only if approved, by explicit anon and authenticated policies', () => {
 const sql=source('supabase/migrations/20261117131347_remove_redundant_autonomo_public_read_policy.sql');
 assert.match(sql,/DROP POLICY "Usuários podem ver serviços aprovados com proteção de conta"/);
 assert.match(sql,/Usuários não autenticados podem ver serviços aprovados \(sem /);
 assert.match(sql,/Usuários autenticados podem ver serviços aprovados \(com conta/);
 assert.match(sql,/status_aprovacao = ''aprovado''::status_servico/);
});

test('user sessions scoped to authenticated, preserving five ownership expressions', () => {
 const sql=source('supabase/migrations/20261117131404_scope_user_sessions_policies_to_authenticated.sql');
 assert.match(sql,/count_checked <> 5/);
 assert.equal((sql.match(/ALTER POLICY /g)||[]).length,5);
 assert.equal((sql.match(/ TO authenticated;/g)||[]).length,5);
 assert.doesNotMatch(sql,/DROP POLICY|USING \(/);
});
