import { readFileSync } from 'node:fs';

export function evaluateLighthouse(report, { enforceBudget = false } = {}) {
  const categories = report.categories || {};
  const audits = report.audits || {};
  const score = id => categories[id]?.score == null ? 'n/d' : String(Math.round(categories[id].score * 100));
  const formatted = id => audits[id]?.displayValue ?? 'n/d';
  const lines = [
    '=== Lighthouse — Saj Tem (simulated mobile) ===',
    'Measured URL: ' + (report.finalDisplayedUrl || report.finalUrl || 'n/d'),
    'Lighthouse version: ' + (report.lighthouseVersion || 'n/d'),
    'Performance: ' + score('performance') + ' / 100',
    'Accessibility: ' + score('accessibility') + ' / 100',
    'Best practices: ' + score('best-practices') + ' / 100',
    'SEO: ' + score('seo') + ' / 100',
    'LCP: ' + formatted('largest-contentful-paint'),
    'FCP: ' + formatted('first-contentful-paint'),
    'Speed Index: ' + formatted('speed-index'),
    'Total Blocking Time: ' + formatted('total-blocking-time'),
    'CLS: ' + formatted('cumulative-layout-shift'),
    'Note: lab simulation, not actual Android field data or INP.'
  ];
  const problems = [];
  if (report.runtimeError) {
    problems.push('Lighthouse runtime error: ' + (report.runtimeError.message || report.runtimeError.code || 'unknown'));
  }
  if (enforceBudget) {
    // Conservative first-stage regression guards for CI's simulated mobile environment.
    // These are maximum tolerances, not target Core Web Vitals.
    const checks = [
      { label: 'Performance score', value: categories.performance?.score, min: 0.60 },
      { label: 'LCP (ms)', value: audits['largest-contentful-paint']?.numericValue, max: 8000 },
      { label: 'CLS', value: audits['cumulative-layout-shift']?.numericValue, max: 0.15 }
    ];
    for (const check of checks) {
      if (typeof check.value !== 'number' || !Number.isFinite(check.value)) {
        problems.push(check.label + ': metric unavailable or invalid');
      } else if (check.min != null && check.value < check.min) {
        problems.push(check.label + ': ' + check.value + ' < minimum ' + check.min);
      } else if (check.max != null && check.value > check.max) {
        problems.push(check.label + ': ' + check.value + ' > maximum ' + check.max);
      }
    }
  }
  return { lines, problems, ok: problems.length === 0 };
}

const invoked = process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href;
if (invoked) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/report-lighthouse.mjs <report.json> [--enforce-budget]');
    process.exitCode = 1;
  } else {
    try {
      const report = JSON.parse(readFileSync(filePath, 'utf8'));
      const result = evaluateLighthouse(report, { enforceBudget: process.argv.includes('--enforce-budget') });
      for (const line of result.lines) console.log(line);
      for (const problem of result.problems) console.error('Lighthouse check failed: ' + problem);
      if (!result.ok) process.exitCode = 1;
    } catch (error) {
      console.error('Could not read Lighthouse report: ' + error.message);
      process.exitCode = 1;
    }
  }
}
