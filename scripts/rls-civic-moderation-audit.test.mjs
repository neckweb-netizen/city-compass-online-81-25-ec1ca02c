import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261117155939_optimize_civic_moderation_audit_rls_twelve_policies.sql', import.meta.url), 'utf8');

test('civic moderation and audit RLS migration preserves all twelve access predicates', () => {
  for (const name of [
    'Apenas admins podem acessar logs de auditoria',
    'Usuários autenticados podem comentar',
    'Usuários podem editar seus comentários',
    'Usuários podem excluir seus comentários',
    'Admins podem ver logs de notificações',
    'Admins podem moderar problemas',
    'Usuários autenticados podem criar problemas',
    'Usuários podem editar seus problemas',
    'Admins podem visualizar rate limits',
    'Admins podem ver respostas',
    'Admins podem gerenciar logs de suporte',
    'Usuários podem ver suas próprias atribuições',
  ]) assert.ok(sql.includes(name),name);
  assert.match(sql,/processed<>12 OR public_count<>3/);
  assert.match(sql,/replace\(target.qual,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql,/replace\(target.with_check,'auth.uid\(\)','\(select auth.uid\(\)\)'\)/);
  assert.match(sql,/target.role_set='\{public\}' AND target.tablename NOT IN \('rate_limits','respostas_enquete','usuario_empresa_admin'\)/);
  assert.match(sql,/stmt:=stmt\|\|' TO authenticated'/);
  assert.doesNotMatch(sql,/DROP POLICY|CREATE POLICY|GRANT |REVOKE /);
  assert.match(sql,/BEGIN;/);
  assert.match(sql,/COMMIT;/);
});
