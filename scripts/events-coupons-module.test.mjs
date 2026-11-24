import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('event publishing requires approved company ownership or MFA-verified administrator', () => {
  const sql = source('supabase/migrations/20261120193000_harden_events_coupons_permissions.sql');
  assert.ok(sql.includes('drop policy if exists "Usuários autenticados podem criar eventos"'));
  assert.ok(sql.includes('private.admin_mfa_verified(cidade_id, false)'));
  assert.ok(sql.includes('e.usuario_id = (select auth.uid())'));
  assert.ok(sql.includes("e.status_aprovacao = 'aprovado'"));
  assert.ok(sql.includes("new.status_aprovacao := 'pendente'"));
  assert.ok(sql.includes('guard_company_event_review_fields'));
});

test('coupon publication obeys validity, business approval and quantity limits', () => {
  const sql = source('supabase/migrations/20261120193000_harden_events_coupons_permissions.sql');
  assert.ok(sql.includes('data_inicio <= now() and data_fim >= now()'));
  assert.ok(sql.includes('quantidade_usada < quantidade_total'));
  assert.ok(sql.includes('cupons_porcentagem_valida'));
  assert.ok(sql.includes('cupons_periodo_valido'));
  assert.ok(sql.includes("e.status_aprovacao = 'aprovado'"));
});

test('coupon redemption uses unique user ledger and row lock', () => {
  const sql = source('supabase/migrations/20261120195500_coupon_redemption_ledger.sql');
  assert.ok(sql.includes('cupom_resgates_unique_account unique (cupom_id, usuario_id)'));
  assert.ok(sql.includes('for update of c'));
  assert.ok(sql.includes('on conflict (cupom_id, usuario_id) do nothing'));
  assert.ok(sql.includes('revoke execute on function public.usar_cupom(uuid) from public, anon'));
  assert.ok(sql.includes('grant execute on function public.usar_cupom(uuid) to authenticated'));
});

test('coupon validation rejects listings from suspended businesses', () => {
  const sql = source('supabase/migrations/20261120200500_coupon_validation_consistent.sql');
  assert.ok(sql.includes("e.status_aprovacao = 'aprovado'"));
  assert.ok(sql.includes('c.data_inicio <= now()'));
  assert.ok(sql.includes('v_cupom.quantidade_usada >= v_cupom.quantidade_total'));
});

test('company coupon management distinguishes private statuses and confirms deletion', () => {
  const page = source('src/components/empresa/EmpresaCuponsList.tsx');
  assert.ok(page.includes("queryKey: ['empresa-cupons', empresaId, isOwner]"));
  assert.ok(page.includes('if (!isOwner)'));
  assert.ok(page.includes("if (!removed) throw new Error"));
  assert.ok(page.includes('await navigator.clipboard.writeText(codigo)'));
  assert.ok(page.includes('Agendado'));
  assert.ok(page.includes('Esgotado'));
  assert.ok(page.includes('Tentar novamente'));
});

test('coupon forms validate discounts and avoid repeated submissions', () => {
  for (const path of [
    'src/components/forms/CupomFormModal.tsx',
    'src/components/admin/forms/CupomForm.tsx',
    'src/components/admin/forms/EditCupomForm.tsx',
  ]) {
    const form = source(path);
    assert.ok(form.includes("data.tipo === 'porcentagem' && data.valor > 100"), path);
    assert.ok(form.includes('submittingRef.current'), path);
    assert.ok(form.includes('isSubmitting'), path);
  }
});

test('public home coupon card confirms copy and filters active period', () => {
  const home = source('src/components/home/LatestCoupons.tsx');
  assert.ok(home.includes('await navigator.clipboard.writeText(codigo)'));
  assert.ok(home.includes(".lte('data_inicio', new Date().toISOString())"));
  assert.ok(home.includes(".eq('empresas.status_aprovacao', 'aprovado')"));
  assert.ok(home.includes('void refetch()'));
});

test('public events include ongoing events and debounced search', () => {
  const page = source('src/components/eventos/EventosContent.tsx');
  assert.ok(page.includes('buscaDebounced'));
  assert.ok(page.includes('data_fim.gte.'));
  assert.ok(page.includes('data_fim.is.null'));
  assert.ok(page.includes('isError, refetch'));
});

test('event managers see pending events but visitors see approved active events', () => {
  const page = source('src/components/empresa/EmpresaEventosList.tsx');
  assert.ok(page.includes("queryKey: ['empresa-eventos', empresaId, isOwner]"));
  assert.ok(page.includes('if (!isOwner)'));
  assert.ok(page.includes('Aguardando aprovação'));
  assert.ok(page.includes('void refetch()'));
});

test('event submission validates time and admin review confirms changed record', () => {
  const form = source('src/components/admin/forms/EventoForm.tsx');
  const admin = source('src/components/admin/sections/EventosSection.tsx');
  assert.ok(form.includes('submittingRef.current'));
  assert.ok(form.includes('dataFim <= dataInicio'));
  assert.ok(form.includes('empresaSelecionada?.cidade_id'));
  assert.ok(admin.includes(".eq('status_aprovacao', 'pendente')"));
  assert.ok(admin.includes('if (!updated) throw new Error'));
  assert.ok(admin.includes('setProcessingId'));
});

test('administrative coupon updates confirm affected records', () => {
  const hook = source('src/hooks/useAdminCupons.tsx');
  const page = source('src/components/admin/sections/CuponsSection.tsx');
  assert.ok(hook.includes('if (!updated) throw new Error'));
  assert.ok(hook.includes('if (!removed) throw new Error'));
  assert.ok(page.includes('isProcessing'));
  assert.ok(page.includes('error'));
});

test('company event edits return modified public details to moderation', () => {
  const sql = source('supabase/migrations/20261120203000_company_event_edit_requires_review.sql');
  const owner = source('src/components/empresa/EmpresaEventosList.tsx');
  const edit = source('src/components/empresa/EventoEditModal.tsx');
  assert.ok(sql.includes("new.status_aprovacao := 'pendente'"));
  assert.ok(sql.includes('new.ativo := false'));
  assert.ok(sql.includes('new.aprovado_por := null'));
  assert.ok(sql.includes('eventos_periodo_coerente'));
  assert.ok(owner.includes('<EventoEditModal'));
  assert.ok(owner.includes('toggleVisibility(evento)'));
  assert.ok(edit.includes(".eq('empresa_id', empresaId)"));
  assert.ok(edit.includes('if (!updated) throw new Error'));
  assert.ok(edit.includes('Alterações nas informações públicas serão enviadas novamente para aprovação.'));
});

test('public event catalog hides company events when the business is suspended', () => {
  const sql = source('supabase/migrations/20261120204500_event_visibility_requires_approved_business.sql');
  assert.ok(sql.includes("status_aprovacao = 'aprovado'"));
  assert.ok(sql.includes('empresa_id is null'));
  assert.ok(sql.includes("e.status_aprovacao = 'aprovado'"));
  assert.ok(sql.includes('e.ativo = true'));
});

test('administrative coupon code is normalized to match validator', () => {
  for (const path of ['src/components/admin/forms/CupomForm.tsx', 'src/components/admin/forms/EditCupomForm.tsx']) {
    const form = source(path);
    assert.ok(form.includes('codigo: data.codigo.trim().toUpperCase()'), path);
  }
});

test('coupon and event plan checks target the selected business, not the first account business', () => {
  const coupons = source('src/components/empresa/EmpresaCuponsList.tsx');
  const events = source('src/components/empresa/EmpresaEventosList.tsx');
  const quick = source('src/components/forms/CupomFormModal.tsx');
  assert.match(coupons, /usePlanoLimites\(empresaId\)/);
  assert.match(events, /usePlanoLimites\(empresaId\)/);
  assert.match(quick, /usePlanoLimites\(form\.watch\('empresa_id'\) \|\| empresaId\)/);
  assert.match(coupons, /checkingLimit/);
  assert.match(events, /checkingLimit/);
  assert.match(quick, /codigo: data\.codigo\.trim\(\)\.toUpperCase\(\)/);
});


test('public event cards and filters support keyboard navigation and undefined city', () => {
  const page = source('src/components/eventos/EventosContent.tsx');
  assert.match(page, /if \(!cidadePadrao\?\.id\) return/);
  assert.match(page, /role="link"/);
  assert.match(page, /tabIndex=\{0\}/);
  assert.match(page, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(page, /aria-label="Filtrar categoria"/);
  assert.match(page, /aria-label="Filtrar período"/);
  assert.match(page, /aria-label="Filtrar preço"/);
  assert.match(page, /loading="lazy"/);
});

test('public event detail reports fetch errors and validates ticket destination', () => {
  const page = source('src/components/eventos/EventoDetailContent.tsx');
  assert.match(page, /isError, refetch/);
  assert.match(page, /if \(isError\) return/);
  assert.match(page, /onClick=\{\(\) => void refetch\(\)\}/);
  assert.match(page, /getSafeNavigationUrl\(evento\?\.link_ingressos\)/);
  assert.match(page, /\{ingressoUrl && <Button asChild>/);
  assert.match(page, /if \(!eventoId\) return/);
  assert.match(page, /if \(!inicio \|\| !fim\) return/);
  assert.match(page, /document\.title = previousTitle/);
});
