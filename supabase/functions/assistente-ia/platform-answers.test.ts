import assert from 'node:assert/strict';
import test from 'node:test';
import { platformAnswer } from './platform-answers.ts';

test('answers the three observed voice transcripts without a company catalog', () => {
  assert.match(platformAnswer('Qual é o programa aí')?.text || '', /Você quer saber/);
  assert.match(platformAnswer('o SAJ tem é o que uma empresa verificada')?.text || '', /selo/);
  assert.match(platformAnswer('o SAJ tem tem produtos')?.text || '', /produtos cadastrados/);
});

test('does not confuse a product search for a question about the site', () => {
  assert.equal(platformAnswer('Onde comprar pizza?'), null);
});

test('responds to basic Portuguese conversation without intercepting searches', () => {
  assert.match(platformAnswer('Bom dia!')?.text || '', /Olá/);
  assert.match(platformAnswer('Valeu')?.text || '', /Por nada/);
  assert.match(platformAnswer('Oi, tudo bem?')?.text || '', /Tudo bem/);
  assert.match(platformAnswer('Como você está?')?.text || '', /Tudo bem/);
  assert.match(platformAnswer('Muito obrigado pela ajuda!')?.text || '', /Por nada/);
  assert.match(platformAnswer('Até mais!')?.text || '', /Até mais/);
  assert.equal(platformAnswer('Oi, onde comprar pizza?'), null);
});
