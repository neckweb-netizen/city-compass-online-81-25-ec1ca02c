import assert from 'node:assert/strict';
import test from 'node:test';
import { findSiteFaq, siteFaq } from './site-faq.ts';

test('all published help questions resolve to their own answer', () => {
  for (const item of siteFaq) {
    assert.equal(findSiteFaq(item.question)?.question, item.question);
    assert.ok(item.link.url.startsWith('/'));
  }
});

test('common natural phrasings find the relevant help answer', () => {
  assert.match(findSiteFaq('Quero cadastrar minha empresa')?.answer || '', /Cadastrar Local/);
  assert.match(findSiteFaq('Onde encontro as vagas?')?.answer || '', /Oportunidades/);
  assert.match(findSiteFaq('O aplicativo funciona offline?')?.answer || '', /internet/);
});

test('generic and unrelated questions do not receive a random FAQ', () => {
  assert.equal(findSiteFaq('Onde comprar pizza?'), null);
  assert.equal(findSiteFaq('Quero ver um local'), null);
  assert.equal(findSiteFaq('Oi, tudo bem?'), null);
});
