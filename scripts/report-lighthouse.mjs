import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/report-lighthouse.mjs <report.json>');
  process.exit(1);
}

const report = JSON.parse(readFileSync(filePath, 'utf8'));
const categories = report.categories || {};
const audits = report.audits || {};
const score = id => categories[id]?.score == null ? 'n/d' : String(Math.round(categories[id].score * 100));
const formatted = id => audits[id]?.displayValue ?? 'n/d';

console.log('=== Lighthouse — Saj Tem (simulated mobile) ===');
console.log('Measured URL:', report.finalDisplayedUrl || report.finalUrl || 'n/d');
console.log('Lighthouse version:', report.lighthouseVersion || 'n/d');
console.log('Performance:', score('performance'), '/ 100');
console.log('Accessibility:', score('accessibility'), '/ 100');
console.log('Best practices:', score('best-practices'), '/ 100');
console.log('SEO:', score('seo'), '/ 100');
console.log('LCP:', formatted('largest-contentful-paint'));
console.log('FCP:', formatted('first-contentful-paint'));
console.log('Speed Index:', formatted('speed-index'));
console.log('Total Blocking Time:', formatted('total-blocking-time'));
console.log('CLS:', formatted('cumulative-layout-shift'));
console.log('Note: lab simulation, not actual Android field data or INP.');

if (report.runtimeError) {
  console.error('Lighthouse runtime error:', report.runtimeError.message || report.runtimeError.code);
  process.exitCode = 1;
}
