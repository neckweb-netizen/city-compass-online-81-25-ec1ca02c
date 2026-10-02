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

test('answers time and privacy questions directly', () => {
  const fixed = new Date('2026-10-01T12:15:00.000Z');
  assert.match(platformAnswer('Que horas são?', fixed)?.text || '', /09:15/);
  assert.match(platformAnswer('Qual horário?')?.text || '', /hora atual.*funcionamento.*evento/i);
  assert.match(platformAnswer('Tem horário')?.text || '', /hora atual.*funcionamento.*evento/i);
  assert.match(platformAnswer('Essa conversa é privada?')?.text || '', /não deve enviar/i);
  assert.match(platformAnswer('O Saj Tem é privatizado?')?.text || '', /não tenho essa informação confirmada/i);
  assert.match(platformAnswer('É privatizado?')?.text || '', /não tenho essa informação confirmada/i);
  assert.match(platformAnswer('Você é uma IA?')?.text || '', /sem usar o Gemini/i);
});

test('keeps company opening-hours questions available to catalog search', () => {
  assert.equal(platformAnswer('Qual o horário da Natulab?'), null);
});

test('answers Saj Tem contact questions without opening a company catalog', () => {
  const withQuestionMark = platformAnswer('Saj Tem WhatsApp?');
  const voiceTranscript = platformAnswer('Saj tem whatsapp');
  assert.match(withQuestionMark?.text || '', /não tem um número oficial de WhatsApp confirmado/i);
  assert.match(voiceTranscript?.text || '', /Entre em Contato/i);
  assert.equal(withQuestionMark?.links[0]?.url, '/contact');
});
