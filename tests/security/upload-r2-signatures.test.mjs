import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the exact signature validator deployed to Supabase Edge Functions,
// without launching the Deno HTTP listener or talking to R2.
const source = readFileSync(new URL('../../supabase/functions/upload-r2/index.ts', import.meta.url), 'utf8');
const start = source.indexOf('function readUint32BE(');
const end = source.indexOf('\nDeno.serve(', start);
assert.ok(start !== -1 && end > start, 'R2 signature validator found in Edge Function source');
const compiled = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const { matchesImageSignature } = runInNewContext(compiled + '\n({matchesImageSignature})');

const bytes = (...a) => Uint8Array.from(a);
const png = bytes(
  137,80,78,71,13,10,26,10, 0,0,0,13, 73,72,68,82,
  ...Array(13).fill(0), 0,0,0,0,
  0,0,0,0, 73,69,78,68, 174,66,96,130
);
const jpeg = bytes(255,216,255,224,0,16,74,70,73,70,0,1,0,1,0,0,0,0,255,217);
const gif = bytes(71,73,70,56,57,97,...Array(16).fill(0),59);
const webp = bytes(82,73,70,70, 16,0,0,0, 87,69,66,80, 86,80,56,32,...Array(8).fill(0));

test('recognizes expected structural markers', () => {
  assert.equal(matchesImageSignature(png,'image/png'),true);
  assert.equal(matchesImageSignature(jpeg,'image/jpeg'),true);
  assert.equal(matchesImageSignature(gif,'image/gif'),true);
  assert.equal(matchesImageSignature(webp,'image/webp'),true);
});

test('rejects fake type, truncated end markers and RIFF size mismatch', () => {
  assert.equal(matchesImageSignature(jpeg,'image/png'),false);
  assert.equal(matchesImageSignature(png.subarray(0,16),'image/png'),false);
  assert.equal(matchesImageSignature(png.subarray(0,png.length-1),'image/png'),false);
  assert.equal(matchesImageSignature(jpeg.subarray(0,jpeg.length-1),'image/jpeg'),false);
  assert.equal(matchesImageSignature(gif.subarray(0,gif.length-1),'image/gif'),false);
  assert.equal(matchesImageSignature(webp.subarray(0,webp.length-1),'image/webp'),false);
  assert.equal(matchesImageSignature(png,'application/pdf'),false);
  assert.equal(matchesImageSignature(bytes(0,0,0),'image/jpeg'),false);
});

test('rejects arbitrary image payload with only a valid prefix', () => {
  assert.equal(matchesImageSignature(bytes(137,80,78,71,13,10,26,10,...Array(32).fill(0)),'image/png'),false);
  assert.equal(matchesImageSignature(bytes(82,73,70,70,0,0,0,0,87,69,66,80,...Array(16).fill(0)),'image/webp'),false);
});
