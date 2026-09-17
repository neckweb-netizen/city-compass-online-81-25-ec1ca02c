import assert from 'node:assert/strict';
import test from 'node:test';
import type { KnowledgeArticle } from './knowledge-r2.ts';
import { answerKnowledgeFollowUp, findKnowledgeArticle, isKnowledgeFollowUp } from './knowledge-match.ts';

const article: KnowledgeArticle = {
  id: '6b34ff47-08b9-4a40-ac74-25b128d09e5a',
  title: 'Como funciona o cartão de fidelidade?',
  answer: 'O cartão é digital. No atendimento, apresente o QR Code do cartão para receber carimbos. Você pode acompanhar seus prêmios em Meus cartões fidelidade.',
  keywords: ['fidelidade', 'cartões', 'carimbos', 'prêmios'],
  sourceUrl: '/fidelidade', active: true, updatedAt: '2026-09-17T00:00:00Z',
};

test('finds Portuguese singular and plural variants without an external model', () => {
  assert.equal(findKnowledgeArticle('Como funcionam os cartões de fidelidade?', [article])?.id, article.id);
  assert.equal(findKnowledgeArticle('Onde vejo meus carimbos?', [article])?.id, article.id);
  assert.equal(findKnowledgeArticle('Onde fica a pizzaria?', [article]), null);
});

test('uses context only for a short follow-up', () => {
  assert.equal(isKnowledgeFollowUp('E como uso o QR Code?'), true);
  assert.equal(isKnowledgeFollowUp('Quero encontrar uma pizzaria aberta'), false);
  assert.match(answerKnowledgeFollowUp('E como uso o QR Code?', article), /No atendimento/);
  assert.match(answerKnowledgeFollowUp('E onde vejo?', article), /acompanhar/);
  assert.match(answerKnowledgeFollowUp('E quanto custa?', article), /não informa esse detalhe/);
});
