// Mantém uma janela pequena de imagens quentes para que avançar/voltar
// nos Stories não espere uma nova requisição. O navegador ainda gerencia
// seu próprio cache HTTP; este cache limita apenas referências JS.
const MAX_IMAGES = 12;
const imageCache = new Map<string, HTMLImageElement>();

export function preloadStoryImage(url: string | null | undefined): void {
  if (!url || typeof window === 'undefined') return;
  if (imageCache.has(url)) return;

  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = url;
  imageCache.set(url, image);

  if (imageCache.size > MAX_IMAGES) {
    const oldestUrl = imageCache.keys().next().value;
    if (oldestUrl) imageCache.delete(oldestUrl);
  }
}

export function isStoryImageReady(url: string | null | undefined): boolean {
  if (!url) return false;
  const image = imageCache.get(url);
  return Boolean(image?.complete && image.naturalWidth > 0);
}

export function preloadStoryWindow(
  stories: ReadonlyArray<{ imagem_story_url: string }>,
  index: number,
): void {
  if (index < 0 || index >= stories.length) return;
  // Primeiro prepara a mídia selecionada, depois as duas seguintes.
  for (const position of [index, index + 1, index + 2, index - 1]) {
    preloadStoryImage(stories[position]?.imagem_story_url);
  }
}
