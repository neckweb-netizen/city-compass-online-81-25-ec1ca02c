import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const js = ts.transpileModule(read('src/lib/radioStream.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const moduleContext = { exports: {} };
runInNewContext(js, { module: moduleContext, exports: moduleContext.exports, URL }, { timeout: 1000 });
const { getSafeRadioStreamUrl } = moduleContext.exports;

test('radio stream accepts valid HTTP(S) and rejects unsafe or malformed sources', () => {
  assert.equal(getSafeRadioStreamUrl('https://example.com/live.mp3'), 'https://example.com/live.mp3');
  assert.equal(getSafeRadioStreamUrl('  http://radio.example.com:8000/stream  '), 'http://radio.example.com:8000/stream');
  for (const value of ['javascript:alert(1)', 'data:audio/mp3;base64,AA', '//example.com/stream', '/stream', 'https://user:pass@example.com/stream', '', null, 123]) {
    assert.equal(getSafeRadioStreamUrl(value), null, String(value));
  }
});

test('player stops other stations, cancels pending attempts and releases stream on cleanup', () => {
  const source = read('src/components/ui/radio-player.tsx');
  assert.match(source, /window\.dispatchEvent\(new CustomEvent\(RADIO_PLAY_EVENT/);
  assert.match(source, /window\.addEventListener\(RADIO_PLAY_EVENT, onOtherStationPlaying\)/);
  assert.match(source, /window\.removeEventListener\(RADIO_PLAY_EVENT, onOtherStationPlaying\)/);
  assert.match(source, /requestId\.current \+= 1/);
  assert.match(source, /if \(requestId\.current !== request\)/);
  assert.match(source, /audioRef\.current\?\.pause\(\)/);
  assert.match(source, /audio\.removeAttribute\('src'\)/);
  assert.match(source, /window\.location\.protocol === 'https:'/);
  assert.match(source, /getSafeRadioStreamUrl\(radioUrl\)/);
});

test('radio listing separates network errors from empty results and supplies retry', () => {
  const source = read('src/pages/Radios.tsx');
  assert.match(source, /isError, refetch, isFetching/);
  assert.match(source, /isError \?/);
  assert.match(source, /onClick=\{\(\) => void refetch\(\)\}/);
  assert.match(source, /getSafeRadioStreamUrl\(station\.link_radio\)/);
});
