// Public, anonymous-only CDN cache. Never accept visitor auth headers or cookies.
const SUPABASE_ORIGIN = 'https://uyleozhwzngnvyddfvni.supabase.co';
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bGVvemh3em5nbnZ5ZGRmdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTAwOTcsImV4cCI6MjA2ODMyNjA5N30.fLmjDxluOc6KSRas2i157D5KmaXcJTmkuzeyFZ2SM4w";

const SECTIONS = new Set(['home', 'locais', 'eventos', 'categorias', 'busca']);

function resolveQuery(query = {}) {
  if (query.resource === 'home-sections') {
    return 'home_sections_order?select=*&ativo=eq.true&order=ordem.asc,section_name.asc';
  }
  if (query.resource === 'banners') {
    const section = query.section;
    if (typeof section !== 'string' || !SECTIONS.has(section)) return null;
    const dbSection = section === 'locais' ? 'empresas' : section;
    return 'banners_publicitarios?select=id,titulo,imagem_url,link_url,ativo,ordem,secao,criado_em,atualizado_em&ativo=eq.true&secao=eq.' + dbSection + '&order=ordem.asc&limit=10';
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const query = resolveQuery(req.query);
  if (!query) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Consulta pública não reconhecida' });
  }
  try {
    const response = await fetch(SUPABASE_ORIGIN + '/rest/v1/' + query, {
      method: 'GET',
      headers: {
        apikey: PUBLIC_ANON_KEY,
        Authorization: 'Bearer ' + PUBLIC_ANON_KEY,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) throw new Error('Anonymous upstream response ' + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('Unexpected upstream shape');
    // Only successful anonymous GETs are cacheable; never cache errors.
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=180, stale-while-revalidate=120');
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Public catalog request failed:', error instanceof Error ? error.message : 'Unknown error');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Dados públicos indisponíveis temporariamente' });
  }
}
