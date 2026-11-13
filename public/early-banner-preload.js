/* Preload the first public home banner before React hydrates.
 * The URL comes from the live public Supabase query, not a hardcoded image;
 * changing banners in the admin panel automatically changes the preload. */
(() => {
  if (location.pathname !== '/') return;
  const tab = new URLSearchParams(location.search).get('tab');
  if (tab && tab !== 'home') return;

  const endpoint = 'https://uyleozhwzngnvyddfvni.supabase.co/rest/v1/banners_publicitarios';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bGVvemh3em5nbnZ5ZGRmdm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTAwOTcsImV4cCI6MjA2ODMyNjA5N30.fLmjDxluOc6KSRas2i157D5KmaXcJTmkuzeyFZ2SM4w';
  const query = '?select=id,titulo,imagem_url,link_url,ativo,ordem,secao,criado_em,atualizado_em&ativo=eq.true&secao=eq.home&order=ordem.asc&limit=10';

  window.__sajtemBannerBootstrap = fetch(endpoint + query, {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
    credentials: 'omit',
    mode: 'cors'
  }).then((response) => {
    if (!response.ok) return null;
    return response.json();
  }).then((rows) => {
    if (!Array.isArray(rows)) return null;
    const firstImage = rows[0]?.imagem_url;
    if (typeof firstImage === 'string') {
      try {
        const url = new URL(firstImage);
        if (url.protocol === 'https:') {
          const preload = document.createElement('link');
          preload.rel = 'preload';
          preload.as = 'image';
          preload.href = url.href;
          preload.setAttribute('fetchpriority', 'high');
          document.head.appendChild(preload);
        }
      } catch { /* Invalid URL: normal React image fallback remains available. */ }
    }
    return rows;
  }).catch(() => null);
})();
