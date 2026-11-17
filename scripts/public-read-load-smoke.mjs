#!/usr/bin/env node
// Safe baseline smoke only: anonymous GETs, hard-bounded requests & concurrency.
// Never use against production without an explicit acknowledgement flag.
// This script does not prove 20k concurrent user capacity.
import { performance } from 'node:perf_hooks';

const args = new Set(process.argv.slice(2));
const base = process.env.SAJTEM_SMOKE_BASE_URL ?? 'https://sajtem.vercel.app';
const origin = new URL(base);
const isProduction = origin.hostname === 'sajtem.vercel.app';
if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
  throw new Error('Invalid target URL');
}
if (!args.has('--allow-small-smoke')) {
  throw new Error('This script requires --allow-small-smoke to make any HTTP requests');
}
if (isProduction && !args.has('--allow-production')) {
  throw new Error('Production target requires additional --allow-production flag');
}
if (!isProduction && origin.hostname !== 'localhost' && origin.hostname !== '127.0.0.1' && !args.has('--allow-external')) {
  throw new Error('External target requires --allow-external');
}

const routes = Object.freeze([
  '/api/public-catalog?resource=home-sections',
  '/api/public-catalog?resource=banners&section=home',
  '/api/public-catalog?resource=categories',
  '/api/public-catalog?resource=cities',
]);
const count = 12; // 3 each; keep intentionally tiny.
const maxParallel = 2;
const durations = [];
let errors = 0;
let hits = 0;
let next = 0;

async function worker() {
  while (next < count) {
    const i = next++;
    const url = new URL(routes[i % routes.length], origin);
    const start = performance.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'error',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      durations.push(performance.now() - start);
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Unexpected response ' + response.status);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Expected anonymous JSON list');
      if (response.headers.get('x-vercel-cache') === 'HIT') hits++;
    } catch (err) {
      errors++;
      console.error('Read-only smoke failed:', err instanceof Error ? err.message : 'unknown');
    }
    // Avoid bursty traffic, even when results are cached.
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}
await Promise.all(Array.from({ length: maxParallel }, () => worker()));

const sorted = durations.toSorted((a, b) => a - b);
const percentile = q => sorted.length ? Math.round(sorted[Math.ceil(sorted.length * q) - 1]) : null;
console.log(JSON.stringify({
  target: origin.origin,
  kind: 'tiny-read-only-smoke-not-load-capacity-proof',
  requests: count, errors, cacheHits: hits,
  latencyMs: { p50: percentile(0.5), p95: percentile(0.95) },
}, null, 2));
if (errors) process.exitCode = 1;
