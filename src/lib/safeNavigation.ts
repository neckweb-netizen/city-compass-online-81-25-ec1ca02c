const hasControlCharacters = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) return true;
  }
  return false;
};

export const getSafeNavigationUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || hasControlCharacters(candidate) || candidate.includes('\\')) return null;
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.href;
  } catch {
    return null;
  }
};

export const isSameOriginNavigation = (value: string): boolean => {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).origin === window.location.origin;
  } catch {
    return false;
  }
};

export const navigateToSafeUrl = (value: unknown): void => {
  const safeUrl = getSafeNavigationUrl(value);
  if (!safeUrl) return;
  if (isSameOriginNavigation(safeUrl)) {
    window.location.assign(safeUrl);
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
};
