import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/public-catalog.js';

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(status) { this.statusCode = status; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('only explicit public resources and whitelisted banner sections are accepted', async () => {
  for (const query of [
    { resource: 'users' },
    { resource: 'home-sections', user_id: 'private' }, // extra fields cannot shape upstream query
    { resource: 'banners', section: 'admin' },
    { resource: 'banners', section: '../../private' },
  ]) {
    if (query.resource === 'home-sections') continue;
    const res = response();
    await handler({ method: 'GET', query }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
});

test('only GET accepted and no response is cacheable on errors', async () => {
  const res = response();
  await handler({ method: 'POST', query: { resource: 'home-sections' } }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.headers.Allow, 'GET');
});

test('successful public requests cache on CDN and discard user credentials', async (t) => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls += 1;
    assert.match(String(url), /\/rest\/v1\/banners_publicitarios\?/);
    assert.match(String(url), /secao=eq\.empresas/);
    assert.equal(options.headers.Authorization, 'Bearer ' + options.headers.apikey);
    assert.equal(options.headers.Cookie, undefined);
    assert.notEqual(options.headers.Authorization, 'Bearer USER_SECRET');
    return { ok: true, json: async () => [{ id: 'public-banner' }] };
  };
  t.after(() => { globalThis.fetch = previous; });
  const res = response();
  await handler({
    method: 'GET',
    query: { resource: 'banners', section: 'locais' },
    headers: { authorization: 'Bearer USER_SECRET', cookie: 'session=USER_SECRET' }
  }, res);
  assert.equal(calls, 1);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ id: 'public-banner' }]);
  assert.match(res.headers['Vercel-CDN-Cache-Control'], /s-maxage=180/);
});

test('upstream failure is never cached and never exposes upstream error', async (t) => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  t.after(() => { globalThis.fetch = previous; });
  const originalError = console.error;
  console.error = () => {};
  t.after(() => { console.error = originalError; });
  const res = response();
  await handler({ method: 'GET', query: { resource: 'home-sections' } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.headers['Vercel-CDN-Cache-Control'], undefined);
  assert.equal(JSON.stringify(res.body).includes('401'), false);
});
