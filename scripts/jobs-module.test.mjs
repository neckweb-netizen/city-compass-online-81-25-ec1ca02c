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
