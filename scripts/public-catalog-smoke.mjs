// Smoke test for deployed Vercel function. Designed to run from GitHub Actions.
const base = process.env.SAJTEM_BASE_URL || 'https://sajtem.vercel.app';
const attempts = Number(process.env.SAJTEM_SMOKE_ATTEMPTS || '1');
const waitMs = Number(process.env.SAJTEM_SMOKE_DELAY_MS || '10000');

const urls = [
  '/api/public-catalog?resource=home-sections',
  '/api/public-catalog?resource=banners&section=home',
  '/api/public-catalog?resource=categories',
  '/api/public-catalog?resource=cities',
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function check() {
  for (const suffix of urls) {
    const url = new URL(suffix, base);
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    const body = await response.text();
    if (!response.ok) throw new Error(url.pathname + ': HTTP ' + response.status);
    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error(url.pathname + ': expected JSON, got ' + response.headers.get('content-type'));
    }
    let data;
    try { data = JSON.parse(body); }
    catch { throw new Error(url.pathname + ': invalid JSON'); }
    if (!Array.isArray(data)) throw new Error(url.pathname + ': expected a list');
    if (suffix.includes('home-sections') && !data.every(row => row.ativo === true && typeof row.section_name === 'string')) {
      throw new Error(url.pathname + ': invalid public sections payload');
    }
    if (suffix.includes('banners') && !data.every(row => row.ativo === true && row.secao === 'home')) {
      throw new Error(url.pathname + ': invalid public banners payload');
    }
    if (suffix.includes('categories') && !data.every(row => row.ativo === true && typeof row.nome === 'string')) throw new Error('Invalid public categories');
    if (suffix.includes('cities') && !data.every(row => row.ativo === true && typeof row.nome === 'string')) throw new Error('Invalid public cities');
    console.log('PASS', url.pathname, 'rows=' + data.length, 'x-vercel-cache=' + (response.headers.get('x-vercel-cache') || 'n/d'));
  }
}

let passed = false;
for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    await check();
    passed = true;
    break;
  } catch (error) {
    console.error('Cache smoke attempt ' + attempt + '/' + attempts + ': ' + error.message);
    if (attempt < attempts) await sleep(waitMs);
  }
}
if (!passed) process.exitCode = 1;
