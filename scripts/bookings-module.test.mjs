import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('appointment status updates require company, original status and confirmed row', () => {
  const hook = read('src/hooks/useAgendamentos.tsx');
  assert.match(hook, /fromStatus: Agendamento\['status'\]/);
  assert.match(hook, /\.eq\('empresa_id', empresaId\)/);
  assert.match(hook, /\.eq\('status', fromStatus\)/);
  assert.match(hook, /if \(!data\) throw new Error/);
  assert.match(hook, /isError/);
  assert.match(hook, /refetch/);
});

test('database prevents owner editing appointment fields and invalid transitions', () => {
  const sql = read('supabase/migrations/20261120221000_guard_booking_status_changes.sql');
  assert.match(sql, /private\.admin_mfa_verified\(v_city, false\)/);
  assert.match(sql, /to_jsonb\(new\) - 'status' - 'atualizado_em'/);
  assert.match(sql, /old\.status = 'pendente' and new\.status in \('confirmado','cancelado'\)/);
  assert.match(sql, /old\.status = 'confirmado' and new\.status in \('concluido','cancelado'\)/);
});

test('booking services have validated duration, price and unique names', () => {
  const sql = read('supabase/migrations/20261120222500_validate_booking_services.sql');
  assert.match(sql, /duracao_minutos between 5 and 1440/);
  assert.match(sql, /preco is null or preco >= 0/);
  assert.match(sql, /unique index if not exists servicos_agendamento_empresa_nome_unique/);
});

test('service edit and delete confirm affected row and respect company scope', () => {
  const hook = read('src/hooks/useServicosAgendamento.tsx');
  assert.match(hook, /\.eq\('empresa_id', empresaId\)/);
  assert.match(hook, /if \(!data\) throw new Error\('Serviço não encontrado/);
  assert.match(hook, /criarServicoAsync: criarServico\.mutateAsync/);
  assert.match(hook, /atualizarServicoAsync: atualizarServico\.mutateAsync/);
});

test('company service form preserves data on failure and saves selected company', () => {
  const form = read('src/components/empresa/ConfiguracaoAgendamentos.tsx');
  assert.match(form, /empresas\.find\(item => item\.id === empresaId\)/);
  assert.match(form, /await atualizarServicoAsync/);
  assert.match(form, /await criarServicoAsync/);
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /updateEmpresaAsync\(\{/);
  assert.match(form, /\}, empresaId\)/);
  assert.match(form, /window\.confirm/);
  assert.match(form, /refetchServicos/);
});

test('business bookings panel handles errors, validates WhatsApp and status transitions', () => {
  const page = read('src/components/empresa/AgendamentosEmpresa.tsx');
  assert.match(page, /isError, refetch/);
  assert.match(page, /contatoValido/);
  assert.match(page, /fromStatus: agendamento\.status/);
  assert.match(page, /disabled=\{isUpdating\}/);
});

test('client booking forms preserve service, slot and timezone validation', () => {
  const form = read('src/components/agendamento/AgendamentoForm.tsx');
  const simple = read('src/components/agendamento/FormularioAgendamento.tsx');
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /horarios\.some\(slot => slot\.horario === formData\.horario\)/);
  assert.match(form, /recarregarServicos/);
  assert.match(simple, /new Date\(formData\.data_agendamento\)\.toISOString\(\)/);
  assert.match(simple, /submittingRef\.current/);
});

test('client booking access is scoped and clients may only cancel their own reservations', () => {
  const sql = read('supabase/migrations/20261120224500_client_booking_access_and_cancellation.sql');
  assert.match(sql, /cliente_usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /status in \('pendente','confirmado'\)/);
  assert.match(sql, /status = 'cancelado'/);
  assert.match(sql, /not coalesce\(v_is_owner, false\)/);
  assert.match(sql, /new\.status <> 'cancelado'/);
  assert.match(sql, /private\.admin_mfa_verified/);
});

test('profile includes protected booking list and confirms cancel updates', () => {
  const profile = read('src/components/profile/ProfileContent.tsx');
  const dialog = read('src/components/profile/MeusAgendamentosDialog.tsx');
  assert.match(profile, /<MeusAgendamentosDialog/);
  assert.match(profile, /Meus Agendamentos/);
  assert.match(dialog, /\.eq\('cliente_usuario_id', user\.id\)/);
  assert.match(dialog, /\.in\('status', \['pendente', 'confirmado'\]\)/);
  assert.match(dialog, /if \(!data\) throw new Error/);
  assert.match(dialog, /window\.confirm/);
  assert.match(dialog, /America\/Bahia/);
});

test('client booking cancellations notify the company without changing payment flows', () => {
  const sql = read('supabase/migrations/20261120230000_notify_company_on_client_booking_cancel.sql');
  assert.match(sql, /new\.status = 'cancelado'/);
  assert.match(sql, /old\.cliente_usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /'appointment_cancelled_by_client'/);
  assert.match(sql, /'\/empresa-dashboard'/);
  assert.doesNotMatch(sql, /pix|pagamento|wallet/i);
});
