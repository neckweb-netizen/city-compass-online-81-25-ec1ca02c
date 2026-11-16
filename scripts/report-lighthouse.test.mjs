import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLighthouse } from './report-lighthouse.mjs';

function report(score = 0.75, lcp = 5200, cls = 0.05) {
  return {
    finalUrl: 'http://127.0.0.1:4173/',
    categories: { performance: { score } },
    audits: {
      'largest-contentful-paint': { numericValue: lcp, displayValue: (lcp / 1000).toFixed(1) + ' s' },
      'cumulative-layout-shift': { numericValue: cls, displayValue: String(cls) }
    }
  };
}

test('passes mobile preview at or within performance tolerances', () => {
  assert.equal(evaluateLighthouse(report(), { enforceBudget: true }).ok, true);
  assert.equal(evaluateLighthouse(report(0.60, 8000, 0.15), { enforceBudget: true }).ok, true);
});

test('fails performance, LCP and CLS regressions independently', () => {
  for (const input of [report(0.59), report(0.75, 8001), report(0.75, 5200, 0.151)]) {
    assert.equal(evaluateLighthouse(input, { enforceBudget: true }).ok, false);
  }
});

test('fails on missing metrics and invalid numbers instead of silent pass', () => {
  assert.equal(evaluateLighthouse({}, { enforceBudget: true }).ok, false);
  assert.equal(evaluateLighthouse(report(NaN), { enforceBudget: true }).ok, false);
});

test('retains report-only mode for production monitoring', () => {
  assert.equal(evaluateLighthouse(report(0.2, 12000, 0.7)).ok, true);
});

test('fails Lighthouse runtime errors even in report-only mode', () => {
  assert.equal(evaluateLighthouse({ ...report(), runtimeError: { message: 'Page load failed' } }).ok, false);
});
