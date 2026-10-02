import assert from 'node:assert/strict';
import test from 'node:test';
import { detectIntents, isNearbyQuery, ordinalIndex, rankLocalItems, shouldSearchCatalog, TOOL_ITEMS } from './local-search.ts';

test('understands synonyms and small typing mistakes without a model', () => {
  const items = [
    { id: '1', kind: 'coupon' as const, name: 'Desconto no almoço', description: 'Oferta do restaurante', address: null, url: '/locais/a' },
    { id: '2', kind: 'company' as const, name: 'Oficina Central', description: 'Manutenção de carros', address: null, url: '/locais/b' },
  ];
  assert.equal(rankLocalItems('tem promoção de comida?', items)[0]?.id, '1');
  assert.equal(rankLocalItems('ofcina para conserto de carro', items)[0]?.id, '2');
});

test('detects content intent and conversational ordinals', () => {
  assert.deepEqual(detectIntents('quero uma vaga de emprego'), ['job']);
  assert.equal(ordinalIndex('mostre a segunda opção'), 1);
  assert.equal(isNearbyQuery('Tem restaurante perto de mim?'), true);
});

test('finds a named free tool', () => {
  const results = rankLocalItems('consultar tabela fipe', TOOL_ITEMS);
  assert.equal(results[0]?.id, 'consulta-fipe');
  assert.equal(results.length, 1);
});

test('keeps an explicit service search within the requested content type', () => {
  const items = [
    { id: '1', kind: 'service' as const, name: 'Maria', description: 'Serviço profissional', address: null, url: '/oportunidades/servicos' },
    { id: '2', kind: 'company' as const, name: 'Auto Service', description: null, address: null, url: '/locais/auto-service' },
  ];
  assert.deepEqual(rankLocalItems('quero um serviço profissional', items).map(item => item.id), ['1']);
});

test('opens the catalog only for an actual local-search request', () => {
  assert.equal(shouldSearchCatalog('Que horas são?'), false);
  assert.equal(shouldSearchCatalog('Qual horário?'), false);
  assert.equal(shouldSearchCatalog('Tem horário'), false);
  assert.equal(shouldSearchCatalog('O Saj Tem é privatizado?'), false);
  assert.equal(shouldSearchCatalog('É privatizado?'), false);
  assert.equal(shouldSearchCatalog('Como funciona isso?'), false);
  assert.equal(shouldSearchCatalog('Onde comprar pizza?'), true);
  assert.equal(shouldSearchCatalog('dentista perto de mim'), true);
  assert.equal(shouldSearchCatalog('Consulta FIPE'), true);
  assert.equal(shouldSearchCatalog('Natulab'), true);
  assert.equal(shouldSearchCatalog('Qual o horário da Natulab?'), true);
  assert.equal(shouldSearchCatalog('onde fica a segunda opção?', true), true);
  assert.equal(shouldSearchCatalog('Saj Tem WhatsApp?'), false);
  assert.equal(shouldSearchCatalog('Saj tem whatsapp'), false);
  assert.equal(shouldSearchCatalog('O site tem Instagram'), false);
});
