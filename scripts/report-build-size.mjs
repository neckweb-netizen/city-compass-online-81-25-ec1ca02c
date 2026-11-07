import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const assets = join(dist, 'assets');
const names = (await readdir(assets)).filter(name => /\.(js|css)$/.test(name));
const sizes = await Promise.all(names.map(async name => {
  const content = await readFile(join(assets, name));
  const compressed = gzipSync(content).byteLength;
  return { name, raw: content.byteLength, gzip: compressed };
}));
sizes.sort((a, b) => b.gzip - a.gzip);
const html = await readFile(join(dist, 'index.html'), 'utf8');
const initialAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(match => match[1].split('/').at(-1));
const initial = sizes.filter(x => initialAssets.includes(x.name));
const format = x => (x / 1024).toFixed(1);
console.log('=== Saj Tem build: transfer estimates (gzip, excluding network headers) ===');
console.log('JS and CSS assets:', sizes.length);
console.log('Referenced from index.html:', initial.map(x => x.name).join(', '));
console.log('Initial entry assets gzip:', format(initial.reduce((sum, x) => sum + x.gzip, 0)), 'KiB');
console.log('All JS/CSS gzip across every route:', format(sizes.reduce((sum, x) => sum + x.gzip, 0)), 'KiB');
console.log('Top 12 gzip assets:');
for (const row of sizes.slice(0, 12)) console.log(row.name, format(row.gzip), 'KiB gzip');
console.log('These are build-size estimates, not a Lighthouse score or actual mobile load.');
