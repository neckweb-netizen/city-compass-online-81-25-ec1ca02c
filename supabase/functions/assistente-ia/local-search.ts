export type SearchKind = 'company' | 'product' | 'coupon' | 'event' | 'job' | 'service' | 'booking' | 'tool';

export type LocalSearchItem = {
  id: string;
  kind: SearchKind;
  name: string;
  description: string | null;
  address: string | null;
  url: string;
  companyId?: string;
  companyName?: string;
  keywords?: string[];
  price?: number | null;
  startsAt?: string | null;
  distanceKm?: number | null;
  phone?: string | null;
  bookable?: boolean;
};

const STOPWORDS = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'em', 'na', 'no', 'um', 'uma', 'eu', 'quero',
  'preciso', 'achar', 'encontrar', 'buscar', 'procuro', 'por', 'favor', 'tem', 'alguma', 'algum', 'que',
  'com', 'agora', 'aqui', 'me', 'mostre', 'onde', 'estou', 'para', 'cidade', 'santo', 'antonio', 'jesus',
  'qual', 'quais', 'uma', 'uns', 'umas', 'pode', 'voce', 'gostaria', 'saber', 'sobre',
]);

const SYNONYMS: Record<string, string[]> = {
  emprego: ['vaga', 'trabalho', 'oportunidade'],
  empregos: ['vaga', 'trabalho', 'oportunidade'],
  trabalho: ['vaga', 'emprego', 'oportunidade'],
  promocao: ['cupom', 'desconto', 'oferta'],
  promocoes: ['cupom', 'desconto', 'oferta'],
  desconto: ['cupom', 'promocao', 'oferta'],
  comprar: ['produto', 'loja', 'vende'],
  preco: ['valor', 'custa', 'barato'],
  comida: ['restaurante', 'lanchonete', 'pizzaria', 'bar'],
  lanche: ['lanchonete', 'hamburguer', 'hamburgueria'],
  pizza: ['pizzaria'],
  cabelo: ['salao', 'barbearia', 'cabeleireiro'],
  medico: ['clinica', 'saude'],
  dentista: ['odontologia', 'clinica'],
  conserto: ['assistencia', 'manutencao', 'reparo'],
  profissional: ['autonomo', 'servico', 'prestador'],
  agenda: ['agendamento', 'horario', 'marcar'],
  reservar: ['agendamento', 'horario', 'marcar'],
  curso: ['evento', 'oficina', 'palestra'],
  festa: ['evento', 'show'],
};

const INTENT_TERMS: Record<SearchKind, RegExp> = {
  company: /\b(empresa|loja|local|estabelecimento|restaurante|pizzaria|barbearia|clinica)\b/,
  product: /\b(produto|comprar|vende|preco|valor|estoque)\b/,
  coupon: /\b(cupom|desconto|promocao|oferta|codigo)\b/,
  event: /\b(evento|show|festa|curso|palestra|oficina|agenda cultural)\b/,
  job: /\b(vaga|emprego|trabalho|estagio|clt|freelance|oportunidade)\b/,
  service: /\b(autonomo|profissional|prestador|servico)\b/,
  booking: /\b(agendar|agendamento|marcar|reservar)\b/,
  tool: /\b(ferramenta|calculadora|gerador|consulta|curriculo|rifa|fipe)\b/,
};

export const TOOL_ITEMS: LocalSearchItem[] = [
  ['gerador-rifa', 'Gerador de rifa', '/ferramentas/gerador-rifa', ['sorteio', 'numero']],
  ['gerador-cobranca', 'Gerador de cobrança', '/ferramentas/gerador-cobranca', ['cobrar', 'pix']],
  ['criador-curriculo', 'Criador de currículo', '/ferramentas/criador-curriculo', ['emprego', 'vaga']],
  ['gestao-cobrancas', 'Gestão de cobranças', '/ferramentas/gestao-cobrancas', ['cliente', 'pagamento']],
  ['calculadora-orcamento', 'Calculadora de orçamento', '/ferramentas/calculadora-orcamento', ['orcamento', 'calcular']],
  ['calculadora-margem', 'Calculadora de margem', '/ferramentas/calculadora-margem', ['lucro', 'preco']],
  ['simulador-rescisao', 'Simulador de rescisão', '/ferramentas/simulador-rescisao', ['trabalho', 'demissao']],
  ['leitor-voz', 'Leitor de texto por voz', '/ferramentas/leitor-voz', ['ler', 'audio']],
  ['consulta-fipe', 'Consulta FIPE', '/ferramentas/consulta-fipe', ['carro', 'moto', 'veiculo']],
  ['ciclo-menstrual', 'Ciclo menstrual', '/ferramentas/ciclo-menstrual', ['saude', 'menstruacao']],
  ['controle-financeiro', 'Controle financeiro', '/ferramentas/controle-financeiro', ['dinheiro', 'financas']],
  ['acompanhamento-gestacional', 'Acompanhamento gestacional', '/ferramentas/acompanhamento-gestacional', ['gravidez', 'gestante']],
  ['medicamentos', 'Lembrete de medicamentos', '/ferramentas/medicamentos', ['remedio', 'saude']],
  ['meu-veiculo', 'Meu veículo', '/ferramentas/meu-veiculo', ['carro', 'moto', 'manutencao']],
].map(([id, name, url, keywords]) => ({
  id: String(id), kind: 'tool', name: String(name), description: 'Ferramenta gratuita do Saj Tem',
  address: null, url: String(url), keywords: keywords as string[],
}));

export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function canonical(word: string): string {
  if (word.endsWith('oes') && word.length > 5) return `${word.slice(0, -3)}ao`;
  if (word.endsWith('ais') && word.length > 5) return `${word.slice(0, -3)}al`;
  if (word.endsWith('s') && word.length > 4) return word.slice(0, -1);
  return word;
}

function levenshteinAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  if (a.length === b.length) {
    let changes = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i] && ++changes > 1) return false;
    return true;
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) { i += 1; j += 1; continue; }
    if (skipped) return false;
    skipped = true;
    j += 1;
  }
  return true;
}

export function queryTokens(query: string): string[] {
  const base = normalizeText(query).split(' ').map(canonical)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
  const expanded = base.flatMap(word => [word, ...(SYNONYMS[word] || []).map(canonical)]);
  return [...new Set(expanded)].slice(0, 20);
}

export function detectIntents(query: string): SearchKind[] {
  const normalized = normalizeText(query);
  return (Object.entries(INTENT_TERMS) as [SearchKind, RegExp][])
    .filter(([, pattern]) => pattern.test(normalized)).map(([kind]) => kind);
}

export function shouldSearchCatalog(query: string, hasPriorResults = false): boolean {
  const normalized = normalizeText(query);
  if (!normalized) return false;
  const aboutPlatform = /\b(saj tem|site|plataforma|aplicativo|app)\b/.test(normalized);
  const platformSubject = /\b(whatsapp|zap|telefone|numero|contato|email|instagram|facebook|dono|administrador|privado|privatizado)\b/.test(normalized);
  if (aboutPlatform && platformSubject) return false;
  if (/^(?:(?:qual(?: e)?(?: o)?|que|tem|e o)\s+)?horario(?: de funcionamento| agora)?$/.test(normalized)) return false;
  if (/^(?:e|eh|isso e)\s+(?:privado|privada|privatizado|privatizada)$/.test(normalized)) return false;
  if (hasPriorResults && (/\b(primeir[ao]|segund[ao]|terceir[ao]|quart[ao]|quint[ao]|mais barato|mais barata|mais perto|onde fica|endereco|telefone|whatsapp|quanto custa|qual o preco|agendar|marcar)\b/.test(normalized))) {
    return true;
  }
  if (detectIntents(normalized).length > 0) return true;
  if (/\b(onde (?:comprar|encontrar|fica)|quero (?:comprar|encontrar|achar)|estou procurando|procuro|buscar|busque|mostre|perto de mim|proximo de mim)\b/.test(normalized)) return true;
  if (/\b(horario|endereco|telefone|whatsapp)\s+(?:de|da|do|dos|das)\s+\S+/.test(normalized)) return true;

  // A short noun/name such as "pizza", "dentista" or "Natulab" is a useful
  // catalog query. Question-like and conversational sentences are not.
  const words = normalized.split(" ");
  const questionLike = /^(quem|o que|que|qual|quais|como|quando|porque|por que|sera|e|eh|isso|voce|essa|esta|a conversa|meus dados)\b/.test(normalized);
  return words.length <= 4 && !questionLike && !/[?]/.test(query) && words.some(word => word.length >= 4);
}

function tokenScore(token: string, words: string[]): number {
  if (words.includes(token)) return 8;
  if (words.some(word => word.startsWith(token) || token.startsWith(word))) return 5;
  if (token.length >= 5 && words.some(word => word.length >= 5 && levenshteinAtMostOne(token, word))) return 3;
  return 0;
}

export function rankLocalItems(query: string, items: LocalSearchItem[], limit = 5): LocalSearchItem[] {
  const normalizedQuery = normalizeText(query);
  const tokens = queryTokens(query);
  const intents = detectIntents(query);
  if (!tokens.length && !intents.length) return [];
  const ranked = items.map((item, index) => {
    const title = normalizeText(item.name);
    const description = normalizeText([item.description, item.address, item.companyName, ...(item.keywords || [])].filter(Boolean).join(' '));
    const titleWords = title.split(' ');
    const descriptionWords = description.split(' ');
    const phrase = normalizedQuery.length >= 4 && title.includes(normalizedQuery) ? 30 : 0;
    const terms = tokens.reduce((total, token) => total + tokenScore(token, titleWords) * 2 + tokenScore(token, descriptionWords), 0);
    const intent = intents.includes(item.kind) ? 18 : 0;
    const nearby = typeof item.distanceKm === 'number' && /\b(perto|proximo|proxima)\b/.test(normalizedQuery)
      ? Math.max(0, 10 - Math.min(item.distanceKm, 10)) : 0;
    return { item, index, score: phrase + terms + intent + nearby, lexicalScore: phrase + terms };
  }).filter(entry => entry.score > 0);
  const lexical = ranked.some(entry => entry.lexicalScore > 0)
    ? ranked.filter(entry => entry.lexicalScore > 0)
    : ranked;
  const intended = intents.length && lexical.some(entry => intents.includes(entry.item.kind))
    ? lexical.filter(entry => intents.includes(entry.item.kind))
    : lexical;
  return intended
    .sort((a, b) => b.score - a.score || (a.item.distanceKm ?? 9999) - (b.item.distanceKm ?? 9999) || a.index - b.index)
    .slice(0, Math.max(1, Math.min(limit, 10))).map(entry => entry.item);
}

export function ordinalIndex(query: string): number | null {
  const match = /\b(primeir[ao]|segund[ao]|terceir[ao]|quart[ao]|quint[ao])\b/.exec(normalizeText(query));
  if (!match) return null;
  return ({ primeiro: 0, primeira: 0, segundo: 1, segunda: 1, terceiro: 2, terceira: 2, quarto: 3, quarta: 3, quinto: 4, quinta: 4 } as Record<string, number>)[match[1]] ?? null;
}

export function isNearbyQuery(query: string): boolean {
  return /\b(perto de mim|proximo de mim|proxima de mim|mais perto|mais proximo|mais proxima)\b/.test(normalizeText(query));
}

export function formatPrice(value: number | null | undefined): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : null;
}
