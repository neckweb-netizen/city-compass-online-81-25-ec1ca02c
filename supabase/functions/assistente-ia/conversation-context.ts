export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

// Only an explicit, short continuation can reuse a previous site fact.
// A new subject always starts from the normal FAQ/catalog search.
export function isConversationFollowUp(message: string): boolean {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return text.length <= 100 && /^(?:e |mas |entao |isso |esse |essa |ele |ela |como |onde |qual |quanto |por que |porque |pode |tem |me explica |explique )/.test(text)
    && /\b(isso|esse|essa|dele|dela|tambem|mais|funciona|fazer|assim|sobre|explica|explicar|passo|proximo|exemplo|como|onde|qual|quanto|porque|por que)\b/.test(text);
}

const SENSITIVE = /(?:\b(?:senha|password|token|cpf|rg|cartao|cartão|pix|conta bancaria|conta bancária)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{8,}\b)/i;

export function boundedHistory(rows: ConversationTurn[]): ConversationTurn[] {
  return rows.slice(-6).filter(row =>
    (row.role === 'user' || row.role === 'assistant') &&
    typeof row.content === 'string' && row.content.length > 0 &&
    row.content.length <= 500 && !SENSITIVE.test(row.content)
  ).map(row => ({ role: row.role, content: row.content.slice(0, 350) }));
}

export function validSiteFact(value: unknown): { text: string; links: { label: string; url: string }[] } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const fact = value as Record<string, unknown>;
  if (typeof fact.text !== 'string' || !fact.text.trim() || fact.text.length > 2000 || !Array.isArray(fact.links)) return null;
  const links = fact.links.filter((link): link is { label: string; url: string } =>
    Boolean(link && typeof link === 'object' && typeof link.label === 'string' && typeof link.url === 'string' &&
      link.label.length <= 80 && link.url.startsWith('/') && !link.url.startsWith('//'))).slice(0, 3);
  return { text: fact.text, links };
}
