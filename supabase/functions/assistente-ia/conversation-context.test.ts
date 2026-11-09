import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedHistory, isConversationFollowUp, validSiteFact } from './conversation-context.ts';

test('recognizes brief continuations without hijacking a new subject', () => {
  assert.equal(isConversationFollowUp('E como faço isso?'), true);
  assert.equal(isConversationFollowUp('Me explica mais sobre isso'), true);
  assert.equal(isConversationFollowUp('Quero uma pizzaria perto de mim'), false);
  assert.equal(isConversationFollowUp('O que é energia solar?'), false);
});

test('only sends a short and privacy-filtered conversation window', () => {
  const turns = [
    { role: 'user' as const, content: 'Antes de tudo' },
    { role: 'assistant' as const, content: 'Olá' },
    { role: 'user' as const, content: 'Meu CPF é 12345678901' },
    { role: 'assistant' as const, content: 'Resposta de teste' },
    { role: 'user' as const, content: 'Meu e-mail é teste@exemplo.com' },
    { role: 'assistant' as const, content: 'Posso ajudar com o site' },
    { role: 'user' as const, content: 'Como funciona?' },
  ];
  assert.deepEqual(boundedHistory(turns).map(t => t.content), ['Olá', 'Resposta de teste', 'Posso ajudar com o site', 'Como funciona?']);
});

test('rejects malformed or external site-context links', () => {
  assert.equal(validSiteFact({ text: '', links: [] }), null);
  assert.deepEqual(validSiteFact({ text: 'Informação oficial', links: [{ label: 'Abrir', url: '/locais' }, { label: 'Ruim', url: '//evil.test' }] }),
    { text: 'Informação oficial', links: [{ label: 'Abrir', url: '/locais' }] });
});
