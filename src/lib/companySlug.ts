/** Names are not unique across businesses.
 * A short random suffix prevents multi-query slug probing from a public browser
 * (which is unreliable under RLS and can loop indefinitely).
 */
export function createCompanySlug(name: string): string {
  const base = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64).replace(/-+$/, '') || 'empresa';
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${base}-${suffix}`;
}
