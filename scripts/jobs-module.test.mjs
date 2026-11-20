import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const js = ts.transpileModule(source('src/lib/jobApplication.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText;
const { getJobApplicationHref, isValidJobApplicationContact } =
  await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('job application contacts support valid WhatsApp, email, and safe web links', () => {
  assert.equal(getJobApplicationHref('email', 'contato@empresa.com.br'), 'mailto:contato@empresa.com.br');
  assert.equal(getJobApplicationHref('whatsapp', '(71) 99999-1234'), 'https://wa.me/5571999991234');
  assert.equal(getJobApplicationHref('site', 'empresa.com.br/vagas'), 'https://empresa.com.br/vagas');
  assert.equal(getJobApplicationHref('linkedin', 'https://www.linkedin.com/jobs'), 'https://www.linkedin.com/jobs');
  assert.equal(isValidJobApplicationContact('presencial', 'Rua Principal, 123'), true);
});

test('job application contacts reject unsafe or unusable destinations', () => {
  for (const contact of ['javascript:alert(1)', 'data:text/html,evil', '//evil.example', 'https://user:pass@evil.example']) {
    assert.equal(getJobApplicationHref('site', contact), null, contact);
  }
  assert.equal(getJobApplicationHref('email', 'sem-arroba'), null);
  assert.equal(getJobApplicationHref('whatsapp', 'telefone qualquer'), null);
  assert.equal(getJobApplicationHref('whatsapp', '123'), null);
  assert.equal(getJobApplicationHref('site', 'localhost'), null);
  assert.equal(getJobApplicationHref('presencial', 'Rua Principal'), null);
  assert.equal(isValidJobApplicationContact('presencial', '   '), false);
});

test('both company vacancy forms validate the contact before saving', () => {
  const modal = source('src/components/forms/VagaFormModal.tsx');
  const panel = source('src/components/empresa/EmpresaVagas.tsx');
  const publicPage = source('src/pages/VagasEmprego.tsx');
  for (const form of [modal, panel]) {
    assert.match(form, /isValidJobApplicationContact\(formData\.forma_candidatura, formData\.contato_candidatura\)/);
  }
  assert.match(publicPage, /getJobApplicationHref\(selectedVaga\.forma_candidatura, selectedVaga\.contato_candidatura\)/);
  assert.match(publicPage, /Candidatar-se/);
});

test('vacancy policies scope permissions to approved company owner or assigned manager', () => {
  const sql = source('supabase/migrations/20261120170000_fix_company_jobs_rls_and_types.sql');
  assert.match(sql, /e\.usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /ua\.usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /e\.status_aprovacao = 'aprovado'/);
  assert.match(sql, /ua\.ativo = true/);
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.match(sql, new RegExp('for ' + operation + ' to authenticated'));
  }
  for (const value of ['pj', 'meio_periodo', 'integral']) {
    assert.ok(sql.includes(`add value if not exists '${value}'`));
  }
});

test('public vacancy search is debounced and mobile card actions remain accessible', () => {
  const page = source('src/pages/VagasEmprego.tsx');
  assert.match(page, /setDebouncedSearch\(searchTerm\.trim\(\)\)/);
  assert.match(page, /window\.clearTimeout\(timeout\)/);
  assert.match(page, /queryKey: \['vagas-emprego', debouncedSearch, selectedCategoria, selectedTipo\]/);
  assert.match(page, /aria-label="Buscar vagas de emprego por título"/);
  assert.match(page, /w-full sm:w-auto shadow-lg/);
});

test('admin vacancy management uses real approved companies and compatible categories', () => {
  const admin = source('src/pages/admin/AdminVagas.tsx');
  assert.match(admin, /\.from\('categorias_oportunidades'\)/);
  assert.match(admin, /\.eq\('tipo', 'vaga'\)/);
  assert.match(admin, /\.from\('empresas'\)/);
  assert.match(admin, /\.eq\('status_aprovacao', 'aprovado'\)/);
  assert.match(admin, /criado_por: empresa\.id/);
  assert.match(admin, /cidade_id: empresa\.cidade_id/);
  assert.match(admin, /selectedEmpresaId/);
  assert.match(admin, /isValidJobApplicationContact\(vaga\.forma_candidatura, vaga\.contato_candidatura\)/);
  assert.doesNotMatch(admin, /00000000-0000-0000-0000-000000000000/);
  for (const kind of ['clt', 'pj', 'estagio', 'temporario', 'freelance', 'meio_periodo', 'integral']) {
    assert.match(admin, new RegExp('<SelectItem value="' + kind + '">'));
  }
  assert.match(admin, /window\.confirm/);
  assert.match(admin, /if \(!removed\) throw new Error/);
  assert.match(admin, /queryKey: \['latest-job-coupons'\]/);
});

test('admin vacancy form distinguishes loading from API failures', () => {
  const admin = source('src/pages/admin/AdminVagas.tsx');
  assert.match(admin, /queryKey: \['admin-vagas-categorias'\]/);
  assert.match(admin, /isLoading: categoriasLoading, isError: categoriasError, refetch: refetchCategorias/);
  assert.match(admin, /isLoading: empresasLoading, isError: empresasError, refetch: refetchEmpresas/);
  assert.match(admin, /void refetchCategorias\(\)/);
  assert.match(admin, /void refetchEmpresas\(\)/);
  assert.match(admin, /onOpenChange=\{handleDialogOpenChange\}/);
  assert.match(admin, /disabled=\{pending \|\| categoriasLoading \|\| categoriasError/);
});

test('company vacancy trigger protects reserved fields without removing admin controls', () => {
  const sql = source('supabase/migrations/20261120172000_guard_company_jobs_reserved_fields.sql');
  assert.match(sql, /security invoker/);
  assert.match(sql, /current_user <> 'authenticated' or public\.user_has_permission\(\)/);
  for (const field of ['destaque', 'criado_por', 'cidade_id', 'visualizacoes']) {
    assert.ok(sql.includes(field));
  }
  assert.match(sql, /before insert or update on public\.vagas_emprego/);
});
