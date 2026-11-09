import assert from 'node:assert/strict';
import test from 'node:test';
import { requestNvidiaFallback } from './nvidia-fallback.ts';

test('never calls NVIDIA when the model or key is missing', async () => {
  let calls = 0;
  const fakeFetch = (async () => { calls++; throw new Error('unexpected'); }) as typeof fetch;
  assert.equal(await requestNvidiaFallback('Pergunta', '', 'meta/llama-3.1-8b-instruct', fakeFetch), null);
  assert.equal(await requestNvidiaFallback('Pergunta', 'test-key', '', fakeFetch), null);
  assert.equal(await requestNvidiaFallback('Pergunta', 'test-key', 'https://example.com', fakeFetch), null);
  assert.equal(calls, 0);
});

test('sends only the question and bounded model instructions', async () => {
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(url, 'https://integrate.api.nvidia.com/v1/chat/completions');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, 'meta/llama-3.1-8b-instruct');
    assert.equal(body.messages.length, 2);
    assert.deepEqual(body.messages[1], { role: 'user', content: 'O que é energia solar?' });
    assert.equal(body.stream, false);
    assert.equal(body.max_tokens, 250);
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Energia solar é a energia obtida do Sol.' } }] }), { status: 200 });
  }) as typeof fetch;
  assert.match(await requestNvidiaFallback('O que é energia solar?', 'test-key', 'meta/llama-3.1-8b-instruct', fakeFetch) || '', /energia obtida/);
});

test('falls back safely when NVIDIA refuses or malforms a response', async () => {
  const refused = (async () => new Response('rate limited', { status: 429 })) as typeof fetch;
  const malformed = (async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })) as typeof fetch;
  assert.equal(await requestNvidiaFallback('Oi?', 'test-key', 'meta/llama-3.1-8b-instruct', refused), null);
  assert.equal(await requestNvidiaFallback('Oi?', 'test-key', 'meta/llama-3.1-8b-instruct', malformed), null);
  const mentionsProvider = (async () => new Response(JSON.stringify({ choices: [{ message: { content: 'Sou a NVIDIA.' } }] }), { status: 200 })) as typeof fetch;
  assert.equal(await requestNvidiaFallback('Quem é você?', 'test-key', 'meta/llama-3.1-8b-instruct', mentionsProvider), null);
});

test('grounds site answers in one bounded official excerpt without conversation history', async () => {
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.max_tokens, 350);
    assert.equal(body.messages.length, 2);
    assert.match(body.messages[0].content, /única fonte de fatos/);
    assert.match(body.messages[1].content, /PERGUNTA: Como funciona o Saj Tem/);
    assert.match(body.messages[1].content, /RESPOSTA OFICIAL/);
    assert.match(body.messages[1].content, /conecta pessoas e empresas/);
    return new Response(JSON.stringify({ choices: [{ message: { content: 'O Saj Tem conecta pessoas e empresas da região.' } }] }), { status: 200 });
  }) as typeof fetch;
  const actual = await requestNvidiaFallback('Como funciona o Saj Tem?', 'test-key', 'meta/llama-3.1-8b-instruct', fakeFetch, 'O Saj Tem conecta pessoas e empresas.');
  assert.match(actual || '', /conecta pessoas e empresas/);
});

test('does not send empty or oversized official site content to the model', async () => {
  let calls = 0;
  const fakeFetch = (async () => { calls++; throw new Error('unexpected'); }) as typeof fetch;
  assert.equal(await requestNvidiaFallback('Pergunta', 'test-key', 'meta/llama-3.1-8b-instruct', fakeFetch, ' '), null);
  assert.equal(await requestNvidiaFallback('Pergunta', 'test-key', 'meta/llama-3.1-8b-instruct', fakeFetch, 'x'.repeat(2401)), null);
  assert.equal(calls, 0);
});

test('uses a short verified-session history only when provided for a conversational follow-up', async () => {
  const fakeFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.messages.slice(1), [
      { role: 'user', content: 'Me explique energia solar' },
      { role: 'assistant', content: 'Energia vinda do Sol' },
      { role: 'user', content: 'E quais as vantagens?' },
    ]);
    assert.doesNotMatch(body.messages[0].content, /NVIDIA/);
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Uma vantagem é a fonte renovável.' } }] }), { status: 200 });
  }) as typeof fetch;
  const answer = await requestNvidiaFallback('E quais as vantagens?', 'test-key', 'meta/llama-3.1-8b-instruct', fakeFetch, undefined, [
    { role: 'user', content: 'Me explique energia solar' },
    { role: 'assistant', content: 'Energia vinda do Sol' },
  ]);
  assert.match(answer || '', /fonte renovável/);
});
