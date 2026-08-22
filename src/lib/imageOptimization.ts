const GOOGLE_OVERSIZED_PATTERN = /=s(\d+)-w(\d+)(?:-[a-z0-9-]+)?$/i;

/**
 * Reduz imagens enormes do Googleusercontent usadas nos cards.
 *
 * Muitas imagens importadas do Google Places chegam como:
 * =s1600-w1200
 *
 * Em cards mobile isso desperdiça muita banda.
 *
 * O helper só altera URLs do Google que já possuem esse padrão.
 * URLs do Supabase, sites externos e imagens pequenas permanecem intactas.
 */
export const getOptimizedImageUrl = (
  url?: string | null,
  targetWidth = 640,
): string => {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.hostname.endsWith('googleusercontent.com')) {
      return url;
    }

    const match = url.match(GOOGLE_OVERSIZED_PATTERN);

    if (!match) {
      return url;
    }

    const originalSize = Number(match[1]);
    const originalWidth = Number(match[2]);

    if (
      Number.isFinite(originalSize) &&
      Number.isFinite(originalWidth) &&
      originalSize <= targetWidth &&
      originalWidth <= targetWidth
    ) {
      return url;
    }

    return url.replace(
      GOOGLE_OVERSIZED_PATTERN,
      `=s${targetWidth}-w${targetWidth}`,
    );
  } catch {
    return url;
  }
};
