/** Somente transmissões HTTP(S) podem ser carregadas no player do portal. */
export function getSafeRadioStreamUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname ||
        url.username || url.password) return null;
    // HTTP de rádio pode ser bloqueado como conteúdo misto por navegadores HTTPS;
    // não modificar a URL silenciosamente nem prometer reprodução.
    return url.toString();
  } catch {
    return null;
  }
}
