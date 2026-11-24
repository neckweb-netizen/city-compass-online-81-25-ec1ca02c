import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('redirects validate codes, same-origin destinations and reject short-url cycles', () => {
  const source = read('src/pages/ShortUrlRedirect.tsx');
  assert.match(source, /\^\[A-Za-z0-9_-\]\{3,32\}\$/);
  assert.match(source, /destination\.origin !== window\.location\.origin/);
  assert.match(source, /decodeURIComponent\(destination\.pathname\)/);
  assert.match(source, /\^\\\/s\(\?:\\\/\|\$\)\/i\.test\(decodedPath\)/);
  assert.match(source, /\['P0002', 'PGRST116'\]\.includes\(error\.code\)/);
  assert.match(source, /setAttempt\(value => value \+ 1\)/);
  assert.match(source, /window\.location\.replace\(destination\.toString\(\)\)/);
  assert.match(source, /return \(\) => \{ active = false; \}/);
});

test('short-url generation accepts internal paths only and deduplicates concurrent creation', () => {
  const source = read('src/hooks/useShortUrls.tsx');
  assert.match(source, /parsedUrl\.origin !== window\.location\.origin/);
  assert.match(source, /requestRef\.current\) return requestRef\.current/);
  assert.match(source, /requestRef\.current = request/);
  assert.match(source, /\^\[A-Za-z0-9_-\]\{3,32\}\$/);
  assert.match(source, /p_original_url: originalPath/);
});

test('share controls copy links only once per interaction', () => {
  const source = read('src/components/ui/share-button.tsx');
  assert.match(source, /if \(copyingRef\.current\) return/);
  assert.match(source, /copyingRef\.current = false/);
  assert.match(source, /encodeURIComponent\(shareUrl\)/);
});
