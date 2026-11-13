import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const fromRepo = (relative) => new URL(relative, root);

test('current home banner PNGs have published WebP alternatives', () => {
  const map = readFileSync(fromRepo('src/lib/optimizedLegacyBanners.ts'), 'utf8');
  assert.match(map, /1783384982527_10miiwnlz\.png/);
  assert.match(map, /1783385181302_6ypdg1pgq\.png/);
  assert.match(map, /optimized-banners/);
});

test('generated WebP files have valid signatures and practical size limits', () => {
  const dir = fromRepo('public/optimized-banners/');
  assert.ok(existsSync(dir));
  const files = readdirSync(dir).filter((file) => file.endsWith('.webp'));
  assert.ok(files.length >= 3, 'expected at least three WebP variants');

  for (const file of files) {
    const fileUrl = new URL(file, dir);
    const buffer = readFileSync(fileUrl);
    assert.equal(buffer.subarray(0, 4).toString(), 'RIFF', file);
    assert.equal(buffer.subarray(8, 12).toString(), 'WEBP', file);
    assert.ok(statSync(fileUrl).size < 150 * 1024, `oversized banner: ${file}`);
  }
});

test('banner uses optimized variants but preserves original on failure', () => {
  const component = readFileSync(fromRepo('src/components/home/BannerSection.tsx'), 'utf8');
  assert.match(component, /optimizedBannerByUrl\[banner\.imagem_url\]\?\.src/);
  assert.match(component, /optimizedBannerByUrl\[banner\.imagem_url\]\?\.srcSet/);
  assert.match(component, /target\.src = banner\.imagem_url/);
});
