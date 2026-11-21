import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('admin dashboard does not turn failed queries into zero counts', () => {
  const hook = read('src/hooks/useAdminData.tsx');
  const section = read('src/components/admin/sections/DashboardSection.tsx');
  assert.match(hook, /const queryError = \[empresasError, usuariosError, eventosError, avaliacoesError, cuponsError, pendentesError\]\.find\(Boolean\)/);
  assert.match(hook, /if \(queryError\) throw queryError/);
  assert.match(section, /if \(isError\) return/);
  assert.match(section, /Não foi possível carregar as estatísticas/);
  assert.match(section, /void refetch\(\)/);
});

test('admin user mutations confirm affected row and expose async status', () => {
  const hook = read('src/hooks/useAdminData.tsx');
  const section = read('src/components/admin/sections/UsuariosSection.tsx');
  assert.match(hook, /if \(!updated\) throw new Error\('Usuário não encontrado/);
  assert.match(hook, /updateUsuario: updateUsuarioMutation\.mutateAsync/);
  assert.match(section, /await updateUsuario\(\{/);
  assert.match(section, /disabled=\{isProcessing\}/);
});

test('admin user profile cache stays scoped to authenticated account', () => {
  const hook = read('src/hooks/useAdminData.tsx');
  assert.match(hook, /queryKey: \['admin-usuarios', user\?\.id\]/);
  assert.match(hook, /queryKey: \['current-user-profile', user\?\.id\]/);
  assert.match(hook, /enabled: !!user\?\.id/);
  assert.match(hook, /\.eq\('id', user\?\.id \|\| ''\)/);
});

test('admin category updates verify that an actual row changed', () => {
  const hook = read('src/hooks/useAdminData.tsx');
  assert.match(hook, /if \(!updated\) throw new Error\('Categoria não encontrada/);
  assert.match(hook, /description: error instanceof Error \? error\.message/);
});

test('direct profile deletion is blocked in the database and admin interface', () => {
  const page = read('src/components/admin/sections/UsuariosSection.tsx');
  const sql = read('supabase/migrations/20261121190500_disable_unsafe_profile_delete_until_account_deletion_workflow.sql');
  assert.match(page, /Exclusão de contas temporariamente bloqueada/);
  assert.doesNotMatch(page, /handleDeleteUser/);
  assert.match(sql, /drop policy if exists "Somente admin geral com MFA pode excluir usuários"/);
  assert.match(sql, /revoke delete on public\.usuarios from authenticated/);
});

test('admin audit and security logs surface read failures instead of an empty report', () => {
  const audit = read('src/components/admin/sections/AuditLogsSection.tsx');
  const security = read('src/components/admin/sections/SecurityLogsSection.tsx');
  assert.match(audit, /if \(isError\) return/);
  assert.match(audit, /void refetch\(\)/);
  assert.match(audit, /if \(usuariosError\) throw usuariosError/);
  assert.match(audit, /log\.table_name === 'usuarios'/);
  assert.match(security, /if \(logsError \|\| dashboardError\) return/);
  assert.match(security, /void refetchLogs\(\); void refetchDashboard\(\)/);
});
