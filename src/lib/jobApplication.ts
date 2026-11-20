// Shared, conservative contact validation for job advertisements.
// Unknown and in-person methods stay visible as text instead of external links.
export const getJobApplicationHref = (method: string, contact: string): string | null => {
  const raw = contact.trim();
  if (!raw) return null;

  if (method === 'email') {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(raw) ? `mailto:${raw}` : null;
  }

  if (method === 'whatsapp') {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length < 10 || digits.length > 15) return null;
    const international = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${international}`;
  }

  if (method === 'site' || method === 'linkedin') {
    if (raw.startsWith('//') || (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\\/\\//i.test(raw))) return null;
    if (/\\s/.test(raw)) return null;
    try {
      const parsed = new URL(/^https?:\\/\\//i.test(raw) ? raw : `https://${raw}`);
      if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname.includes('.') || parsed.username || parsed.password) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  return null;
};

export const isValidJobApplicationContact = (method: string, contact: string): boolean => {
  return method === 'presencial'
    ? contact.trim().length > 0
    : getJobApplicationHref(method, contact) !== null;
};
