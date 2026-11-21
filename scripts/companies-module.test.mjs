import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('public company discovery only returns active approved businesses', () => {
  const hooks = src('src/hooks/useEmpresas.tsx');
  assert.match(hooks, /\.eq\('ativo', true\)\s*\.eq\('status_aprovacao', 'aprovado'\)/);
  assert.doesNotMatch(hooks, /console\.log\('🔍 useEmpresaById/);
});

test('company panel preserves query failures and adapts header to mobile', () => {
  const hook = src('src/hooks/useMinhaEmpresa.tsx');
  const panel = src('src/components/empresa/EmpresaDashboard.tsx');
  assert.match(hook, /if \(error\) throw error/);
  assert.match(panel, /Não foi possível carregar suas empresas/);
  assert.match(panel, /flex flex-col gap-4 lg:flex-row/);
});

test('company administrative operations confirm database mutation results', () => {
  const hook = src('src/hooks/useAdminEmpresas.tsx');
  const pending = src('src/components/admin/sections/EmpresasPendentesSection.tsx');
  const list = src('src/components/admin/sections/EmpresasSection.tsx');
  for (const text of ['if (!updated) throw new Error', 'if (!removed) throw new Error', "['ativo', 'verificado', 'destaque']"]) {
    assert.ok(hook.includes(text), text);
  }
  assert.match(hook, /\.eq\('status_aprovacao', 'pendente'\)/);
  assert.match(pending, /errorPendentes/);
  assert.match(pending, /disabled=\{isProcessing\}/);
  assert.match(list, /disabled=\{isProcessing\}/);
});

test('company forms validate categories and block duplicate submissions', () => {
  const registration = src('src/pages/CadastroLocal.tsx');
  const wizard = src('src/components/profile/CadastrarEmpresaDialog.tsx');
  const admin = src('src/components/admin/forms/EmpresaForm.tsx');
  const edit = src('src/components/empresa/EmpresaEditForm.tsx');
  for (const form of [registration, wizard, admin]) {
    assert.match(form, /submittingRef\.current/);
    assert.match(form, /categoriasError/);
    assert.match(form, /refetchCategorias/);
  }
  assert.match(admin, /createCompanySlug\(data\.nome\)/);
  assert.doesNotMatch(admin, /while \(true\)/);
  assert.match(edit, /isUpdating/);
  assert.match(edit, /\.eq\('tipo', 'empresa'\)/);
  assert.match(edit, /refetchCategorias/);
});

test('existing RLS-based controls for company approval and billing remain outside frontend edits', () => {
  const hook = src('src/hooks/useMinhaEmpresa.tsx');
  const registration = src('src/pages/CadastroLocal.tsx');
  assert.match(hook, /\.eq\('usuario_id', user\.id\)/);
  assert.match(registration, /usuario_id: user\.id/);
});

test('authenticated business registration reuses current account and never requires its password', () => {
  const wizard = src('src/components/profile/CadastrarEmpresaDialog.tsx');
  assert.match(wizard, /currentStep === 2 && user &&/);
  assert.match(wizard, /currentStep === 2 && !user &&/);
  assert.match(wizard, /senha: ''/);
  assert.match(wizard, /senha: z\.string\(\)\.min\(8/);
  assert.match(wizard, /ownerUserId: string \| null = user\?\.id \?\? null/);
  assert.match(wizard, /\.from\('empresas'\)\.insert\(/);
});
