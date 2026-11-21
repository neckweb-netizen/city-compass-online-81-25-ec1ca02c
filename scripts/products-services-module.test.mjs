import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('public catalog restricts products to active, approved businesses', () => {
  const hook = source('src/hooks/useProdutos.tsx');
  const sql = source('supabase/migrations/20261120181000_products_visibility_and_validations.sql');
  assert.match(hook, /empresas!inner\(/);
  assert.match(hook, /\.eq\('empresas\.ativo', true\)/);
  assert.match(hook, /\.eq\('empresas\.status_aprovacao', 'aprovado'\)/);
  assert.match(sql, /e\.status_aprovacao = 'aprovado'/);
  for (const constraint of ['produtos_preco_original_positivo', 'produtos_preco_promocional_positivo', 'produtos_estoque_nao_negativo']) {
    assert.ok(sql.includes(constraint));
  }
});

test('company product form prevents invalid prices, inventory and untrusted WhatsApp links', () => {
  const form = source('src/components/empresa/ProdutoForm.tsx');
  assert.match(form, /preco_promocional: z\.number\(\)\.positive/);
  assert.match(form, /estoque_disponivel: z\.number\(\)\.int/);
  assert.match(form, /getSafeNavigationUrl\(data\.link_whatsapp\)/);
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /setValueAs: value => value === '' \? undefined : Number\(value\)/);
});

test('product changes belong to company and soft deletion confirms affected record', () => {
  const hook = source('src/hooks/useProdutos.tsx');
  const listing = source('src/components/empresa/ProdutosList.tsx');
  assert.match(hook, /\.eq\('empresa_id', empresa_id\)/);
  assert.match(hook, /\.eq\('empresa_id', empresaId\)/);
  assert.match(hook, /if \(!data\) throw new Error\('Produto não encontrado/);
  assert.match(listing, /excluirProduto\.mutateAsync\(\{ id: deleteId, empresaId \}\)/);
  assert.match(listing, /visibleProducts\.map/);
  assert.match(listing, /Desativado/);
  assert.match(listing, /isError/);
  assert.match(listing, /void refetch\(\)/);
});

test('quick product creation refuses duplicate submissions and errors fetching owner companies', () => {
  const form = source('src/components/forms/ProdutoFormModal.tsx');
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /empresasError/);
  assert.match(form, /refetchEmpresas/);
  assert.match(form, /\.eq\('status_aprovacao', 'aprovado'\)/);
  assert.match(form, /invalidateQueries\(\{ queryKey: \['produtos'\] \}\)/);
});

test('autonomous services search and create recover query failures and use configured city', () => {
  const list = source('src/pages/ServicosAutonomos.tsx');
  const form = source('src/pages/AnunciarServico.tsx');
  assert.match(list, /categoria_slug: selectedCategoria === 'all' \? null/);
  assert.match(list, /setDebouncedSearch\(searchTerm\.trim\(\)\)/);
  assert.match(list, /isError, refetch/);
  assert.match(form, /useCidadePadrao\(\)/);
  assert.match(form, /cidade_id: cidadePadrao\.id/);
  assert.match(form, /usuario_id: user\.id/);
  assert.match(form, /submittingRef\.current/);
  assert.doesNotMatch(form, /\.limit\(1\)/);
});

test('autonomous service review permissions are protected by database trigger', () => {
  const sql = source('supabase/migrations/20261120190500_guard_autonomo_review_fields.sql');
  assert.match(sql, /new\.status_aprovacao := 'pendente'/);
  assert.match(sql, /new\.usuario_id is distinct from old\.usuario_id/);
  assert.match(sql, /new\.visualizacoes is distinct from old\.visualizacoes/);
  assert.match(sql, /private\.admin_mfa_verified/);
});

test('admin services confirm deletion and protect against concurrent submissions', () => {
  const admin = source('src/pages/admin/AdminServicos.tsx');
  assert.match(admin, /if \(!removed\) throw new Error/);
  assert.match(admin, /const pending = createMutation\.isPending/);
  assert.match(admin, /window\.confirm/);
  assert.match(admin, /isError, refetch/);
  assert.match(admin, /refetchCategorias/);
  assert.match(admin, /refetchCidades/);
});

test('service contact actions offer login and validate outbound links', () => {
  const contact = source('src/components/servicos/ServicoContactInfo.tsx');
  assert.match(contact, /setShowAuthDialog\(true\)/);
  assert.match(contact, /getJobApplicationHref\('whatsapp'/);
  assert.match(contact, /getJobApplicationHref\('email'/);
  assert.doesNotMatch(contact, /disabled=\{!user && !isOwner\}/);
});


test('product quotas always use selected business and reject failed database counts', () => {
  const limits = source('src/hooks/usePlanoLimites.tsx');
  const list = source('src/components/empresa/ProdutosList.tsx');
  const quick = source('src/components/forms/ProdutoFormModal.tsx');
  assert.match(limits, /usePlanoLimites = \(empresaId\?: string\)/);
  assert.match(limits, /empresas\.find\(item => item\.id === empresaId\)/);
  assert.match(limits, /queryKey: \['plano-limites', empresa\?\.id/);
  assert.match(limits, /limite_produtos;[\s\S]*?if \(error\) throw error/);
  assert.match(list, /usePlanoLimites\(empresaId\)/);
  assert.match(quick, /usePlanoLimites\(form\.watch\('empresa_id'\)\)/);
});
