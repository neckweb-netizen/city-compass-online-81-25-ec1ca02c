import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const compiled = ts.transpileModule(source('src/lib/canalMedia.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
runInNewContext(compiled, { module: mod, exports: mod.exports, URL }, { timeout: 2000 });
const { getYoutubeVideoId, isSafeCanalMediaUrl, isCanalVideoUrl, isCanalImageUrl } = mod.exports;

test('recognize only genuine HTTPS YouTube hosts and validated 11-char IDs', () => {
  assert.equal(getYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(getYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(getYoutubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  for (const url of [
    'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
    'https://evil.test/?v=www.youtube.com/watch?v=dQw4w9WgXcQ',
    'javascript:youtube.com/watch?v=dQw4w9WgXcQ',
    'http://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=invalid',
  ]) assert.equal(getYoutubeVideoId(url), null, url);
});

test('only safe HTTPS image and video URLs reach the player', () => {
  assert.equal(isCanalVideoUrl('https://example.com/movie.mp4?token=abc'), true);
  assert.equal(isCanalImageUrl('https://example.com/photo.webp?size=large'), true);
  assert.equal(isCanalVideoUrl('https://example.com/photo.mp4.evil'), false);
  assert.equal(isCanalImageUrl('https://example.com/redirect?file=photo.jpg'), false);
  assert.equal(isSafeCanalMediaUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isCanalVideoUrl('https://fake-youtube.com/watch?v=dQw4w9WgXcQ'), false);
  assert.equal(isCanalVideoUrl('http://example.com/a.mp4'), false);
});

test('canal page waits for query results before highlighting a post', () => {
  const page = source('src/pages/CanalInformativo.tsx');
  const list = source('src/components/canal/CanalInformativoList.tsx');
  assert.match(page, /<CanalInformativoList highlightPostId=\{postId\} \/>/);
  assert.doesNotMatch(page, /setTimeout\(/);
  assert.match(list, /items\.some\(item => item\.id === highlightPostId\)/);
  assert.match(list, /scrollIntoView/);
  assert.match(list, /window\.clearTimeout\(timeout\)/);
  assert.match(list, /if \(error\) return/);
  assert.match(list, /void refetch\(\)/);
});

test('media player constructs safe embeds and supports a direct share fallback', () => {
  const player = source('src/components/ui/video-player-with-ad.tsx');
  const list = source('src/components/canal/CanalInformativoList.tsx');
  assert.match(player, /getYoutubeVideoId\(url\)/);
  assert.match(player, /isSafeCanalMediaUrl\(videoUrl\)/);
  assert.match(player, /disabled=\{!safeVideoUrl\}/);
  assert.match(list, /isCanalVideoUrl\(item\.url_midia\)/);
  assert.match(list, /isCanalImageUrl\(item\.url_midia\)/);
  assert.match(list, /return originalUrl;/);
  assert.match(list, /error\.name === 'AbortError'/);
  assert.match(list, /noopener,noreferrer/);
});


test('video advertisement does not change on countdown renders or retain state across posts', () => {
  const player = source('src/components/ui/video-player-with-ad.tsx');
  assert.match(player, /const selectedBanner = useMemo\(\(\) => \{/);
  assert.match(player, /\[banners, videoUrl\]/);
  assert.doesNotMatch(player, /Math\.random\(\)/);
  assert.match(player, /setIsPlaying\(false\);\s*setShowAd\(false\);\s*setAdCountdown\(5\);\s*setCanSkip\(false\)/);
  assert.doesNotMatch(player, /videoElement\.parentNode\?\.replaceChild\(/);
});
