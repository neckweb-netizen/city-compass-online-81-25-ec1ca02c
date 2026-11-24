import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('contact form validates bounded fields and stops duplicate submits', () => {
  const form = read('src/components/contact/ContactForm.tsx');
  for (const max of ['.max(100,', '.max(150,', '.max(5000,', '.max(30,', '.max(254,']) assert.ok(form.includes(max));
  assert.match(form, /if \(submittingRef\.current\) return/);
  assert.match(form, /submittingRef\.current = false/);
  assert.match(form, /setSubmissionStatus\('error'\)/);
});
test('backend rejects oversized or invalid contact fields before escaping', () => {
  const edge = read('supabase/functions/send-contact-email/index.ts');
  assert.match(edge, /enforceRateLimit\(req, "contact", 5, 10 \* 60 \* 1000\)/);
  assert.match(edge, /trimmed\.length < min \|\| trimmed\.length > max/);
  assert.match(edge, /readText\(input\.nome, "Nome", 2, 100\)/);
  assert.match(edge, /readText\(input\.assunto, "Assunto", 5, 150\)/);
  assert.match(edge, /readText\(input\.mensagem, "Mensagem", 10, 5000\)/);
  assert.match(edge, /adminEmailResponse\.error \|\| !adminEmailResponse\.data\?\.id/);
});
test('UI confirms delivery provider acceptance rather than HTTP-only success', () => {
  const hook = read('src/hooks/useEmailService.tsx');
  assert.match(hook, /result\.success !== true \|\| !result\.id/);
});


test('contact form shows optional phone validation and respects input limits', () => {
  const form = read('src/components/contact/ContactForm.tsx');
  assert.match(form, /aria-describedby=\{errors\.telefone \? 'erro-telefone' : undefined\}/);
  assert.match(form, /id="erro-telefone" role="alert"/);
  for (const max of ['maxLength={100}', 'maxLength={254}', 'maxLength={30}', 'maxLength={150}', 'maxLength={5000}']) {
    assert.ok(form.includes(max), 'Missing input limit: ' + max);
  }
});
test('contact submission only has inline success and failure messages', () => {
  const hook = read('src/hooks/useEmailService.tsx');
  const contactFn = hook.slice(hook.indexOf('const sendContactEmail ='), hook.indexOf('return {', hook.indexOf('const sendContactEmail =')));
  assert.doesNotMatch(contactFn, /toast\.(success|error)\(/);
  const form = read('src/components/contact/ContactForm.tsx');
  assert.match(form, /submissionStatus === 'success'/);
  assert.match(form, /submissionStatus === 'error'/);
});
