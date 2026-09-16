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
