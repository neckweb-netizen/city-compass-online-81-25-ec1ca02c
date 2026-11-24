/** Validates third-party media hostnames instead of substring matches. */
export const getYoutubeVideoId = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.split('/')[1] ?? null;
    } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'watch') id = url.searchParams.get('v');
      else if (['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1] ?? null;
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

export const isSafeCanalMediaUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const isCanalVideoUrl = (value: string): boolean => {
  if (!isSafeCanalMediaUrl(value)) return false;
  if (getYoutubeVideoId(value)) return true;
  const url = new URL(value);
  return /\.(mp4|webm|ogg|mov)$/i.test(url.pathname);
};

export const isCanalImageUrl = (value: string): boolean => {
  if (!isSafeCanalMediaUrl(value)) return false;
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(new URL(value).pathname);
};
