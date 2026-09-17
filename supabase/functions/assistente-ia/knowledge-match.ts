import type { KnowledgeArticle } from './knowledge-r2.ts';

const COMMON_WORDS = new Set(['como', 'qual', 'quais', 'quando', 'onde', 'porque', 'funciona', 'sobre', 'para', 'quero', 'saber', 'pode', 'site', 'voce', 'faco', 'fazer', 'isso', 'tambem']);

function canonical(word: string): string {
  if (word.endsWith('oes') && word.length > 5) return `${word.slice(0, -3)}ao`;
  if (word.endsWith('is') && word.length > 5) return `${word.slice(0, -2)}l`;
  if (word.endsWith('s') && word.length > 4) return word.slice(0, -1);
  return word;
}

function words(value: string): string[] {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length >= 4 && !COMMON_WORDS.has(word)).map(canonical);
}

export function findKnowledgeArticle(question: string, articles: KnowledgeArticle[]): KnowledgeArticle | null {
  const query = [...new Set(words(question))].slice(0, 12);
  if (!query.length) return null;
  const scored = articles.filter(article => article.active).map(article => {
    const title = new Set(words(article.title));
    const keywords = new Set(article.keywords.flatMap(words));
    const score = query.reduce((total, word) => total + (title.has(word) ? 3 : 0) + (keywords.has(word) ? 3 : 0), 0);
    return { article, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 3 ? scored[0].article : null;
}

export function isKnowledgeFollowUp(question: string): boolean {
  const normalized = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return normalized.length <= 120 && /^(e (como|onde|quando|quanto|isso|ele|ela|se)|mas (como|onde|quando)|como faco|onde vejo)\b/.test(normalized);
}

export function answerKnowledgeFollowUp(question: string, article: KnowledgeArticle): string {
  const terms = new Set(words(question));
  const normalized = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(vejo|ver|consulto|acompanho)\b/.test(normalized)) terms.add('acompanhar');
  if (/\b(uso|usar|utilizo)\b/.test(normalized)) terms.add('apresente');
  if (/\b(participo|participar|entro)\b/.test(normalized)) terms.add('participar');
  const sentences = article.answer.match(/[^.!?]+[.!?]?/g)?.map(value => value.trim()).filter(Boolean) || [];
  const relevant = sentences.map(sentence => ({ sentence, score: words(sentence).filter(word => terms.has(word)).length }))
    .sort((a, b) => b.score - a.score)[0];
  return relevant?.score ? relevant.sentence : `O artigo sobre ${article.title.toLowerCase().replace(/[?.!]+$/, '')} não informa esse detalhe. Consulte a página indicada para orientações atualizadas.`;
}
