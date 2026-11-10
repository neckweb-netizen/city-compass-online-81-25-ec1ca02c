import assert from 'node:assert/strict';
import test from 'node:test';
import { detectIntents, isNearbyQuery, ordinalIndex, queryTokens, rankLocalItems, shouldSearchCatalog, TOOL_ITEMS } from './local-search.ts';

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

test('does not invent catalog matches when a named business is missing', () => {
  assert.deepEqual(queryTokens('Encontre a empresa Eluz'), ['eluz']);
  const items = [
    { id: '1', kind: 'company' as const, name: 'Mercado Central', description: 'Empresa de alimentos', address: null, url: '/locais/mercado' },
    { id: '2', kind: 'company' as const, name: 'Oficina São José', description: 'Loja de peças', address: null, url: '/locais/oficina' },
    { id: '3', kind: 'company' as const, name: 'ELUZ Assistência Técnica', description: null, address: null, url: '/locais/eluz' },
    { id: '4', kind: 'company' as const, name: 'Belezura', description: 'Luz para cabelos', address: null, url: '/locais/belezura' },
  ];
  assert.deepEqual(rankLocalItems('Encontre a empresa Eluz', items).map(item => item.id), ['3']);
  assert.deepEqual(rankLocalItems('Encontre a empresa Inexistente', items), []);
  assert.deepEqual(rankLocalItems('Encontre a empresa Mercado Central', items).map(item => item.id), ['1']);
  assert.equal(rankLocalItems('Mostre empresas', items).length, 4);
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
  assert.equal(shouldSearchCatalog('Natulab'), false);
  assert.equal(shouldSearchCatalog('Qual o horário da Natulab?'), true);
  assert.equal(shouldSearchCatalog('onde fica a segunda opção?', true), true);
  assert.equal(shouldSearchCatalog('Saj Tem WhatsApp?'), false);
  assert.equal(shouldSearchCatalog('Saj tem whatsapp'), false);
  assert.equal(shouldSearchCatalog('O site tem Instagram'), false);
  assert.equal(shouldSearchCatalog('produto'), false);
  assert.equal(shouldSearchCatalog('iphone 16'), false);
  assert.equal(shouldSearchCatalog('O que você acha desse produto?'), false);
  assert.equal(shouldSearchCatalog('Qual celular tem melhor preço?'), false);
  assert.equal(shouldSearchCatalog('Me fale sobre uma pizzaria'), false);
  assert.equal(shouldSearchCatalog('Quais são as vantagens de comprar online?'), false);
  assert.equal(shouldSearchCatalog('Mostre lojas de roupas'), true);
  assert.equal(shouldSearchCatalog('Tem alguma barbearia?'), true);
  assert.equal(shouldSearchCatalog('Onde encontro um produto perto de mim?'), true);
  assert.equal(shouldSearchCatalog('Assistência técnica'), true);
  assert.equal(shouldSearchCatalog('Barbeiro'), true);
  assert.equal(shouldSearchCatalog('Cortar cabelo'), true);
  assert.equal(shouldSearchCatalog('Agendar'), false);
});

test('a specific category excludes unrelated companies and content types', () => {
  const items = [
    { id: 'tech', kind: 'company' as const, name: 'Reparo Celular', description: 'Conserto de celulares', address: null, url: '/locais/tech', keywords: ['Assistência Técnica'] },
    { id: 'food', kind: 'company' as const, name: 'Restaurante Central', description: 'Refeições e lanches', address: null, url: '/locais/food', keywords: ['Restaurantes'] },
    { id: 'event', kind: 'event' as const, name: 'Feira de tecnologia', description: 'Assistência técnica no evento', address: null, url: '/eventos/event' },
    { id: 'beauty', kind: 'company' as const, name: 'Barbearia Bahia', description: 'Corte masculino', address: null, url: '/locais/beauty', keywords: ['Barbearias'] },
  ];
  assert.deepEqual(rankLocalItems('Assistência técnica', items).map(item => item.id), ['tech']);
  assert.deepEqual(rankLocalItems('Barbeiro', items).map(item => item.id), ['beauty']);
  assert.deepEqual(rankLocalItems('Cortar cabelo', items).map(item => item.id), ['beauty']);
});

test('real registered companies from other categories never appear for technical assistance', () => {
  const items = [
    { id: 'eluz', kind: 'company' as const, name: 'ELUZ Assistência Técnica', description: 'Estabelecimento importado do Google Maps para o Guia SAJ Tem.', address: null, url: '/locais/eluz', keywords: ['Comércio'] },
    { id: 'natulab', kind: 'company' as const, name: 'Natulab Laboratório S.A', description: 'Distribuidora de Produtos Farmacêuticos', address: null, url: '/locais/natulab', keywords: ['Saúde'] },
    { id: 'passo', kind: 'company' as const, name: 'Passo a Passo', description: null, address: null, url: '/locais/passo', keywords: ['Comércio'] },
  ];
  assert.deepEqual(rankLocalItems('Assistência técnica', items).map(item => item.id), ['eluz']);
});
