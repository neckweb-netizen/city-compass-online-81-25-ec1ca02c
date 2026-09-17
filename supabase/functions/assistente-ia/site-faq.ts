// Public help content shared by the help page and the assistant.
export type SiteFaq = { question: string; answer: string; link: { label: string; url: string }; terms: string[] };

export const siteFaq: SiteFaq[] = [
  { question: 'Como cadastrar meu local?', answer: 'Entre na sua conta e acesse Cadastrar Local. Preencha os dados da empresa e envie para aprovação. O local aparece publicamente após a análise.', link: { label: 'Cadastrar local', url: '/cadastro-local' }, terms: ['cadastrar', 'local', 'empresa'] },
  { question: 'Como avaliar um local?', answer: 'Abra o perfil do local e use a opção Avaliar. Faça login se o site solicitar; sua avaliação poderá incluir estrelas e comentário.', link: { label: 'Explorar locais', url: '/locais' }, terms: ['avaliar', 'avaliacao', 'local', 'empresa'] },
  { question: 'Como usar cupons de desconto?', answer: 'Quando houver um cupom disponível, confira as condições e a validade, copie o código e apresente-o à empresa participante. Confirme as regras diretamente com ela.', link: { label: 'Explorar locais', url: '/locais' }, terms: ['cupom', 'cupons', 'desconto', 'codigo'] },
  { question: 'Como favoritar locais?', answer: 'No perfil do local, toque no ícone de coração. Depois, veja os locais salvos na área de favoritos do seu perfil.', link: { label: 'Explorar locais', url: '/locais' }, terms: ['favoritar', 'favoritos', 'salvar', 'locais'] },
  { question: 'Como buscar vagas de emprego?', answer: 'Abra Oportunidades e depois Vagas para consultar os anúncios disponíveis. A existência e os detalhes de cada vaga dependem de quem a publicou.', link: { label: 'Ver vagas', url: '/oportunidades/vagas' }, terms: ['vagas', 'vaga', 'emprego', 'trabalho'] },
  { question: 'Como anunciar serviços autônomos?', answer: 'Acesse a área de Oportunidades e escolha Anunciar Serviço. Entre na sua conta, preencha os dados solicitados e siga as etapas exibidas.', link: { label: 'Anunciar serviço', url: '/oportunidades/anunciar-servico' }, terms: ['anunciar', 'servico', 'autonomo', 'prestador'] },
  { question: 'Como acompanhar eventos da cidade?', answer: 'Abra Eventos para consultar as publicações disponíveis, com datas, locais e demais informações fornecidas pelos organizadores.', link: { label: 'Ver eventos', url: '/eventos' }, terms: ['eventos', 'evento', 'programacao', 'agenda'] },
  { question: 'O que são as Stories?', answer: 'Stories são publicações rápidas de empresas ou do site. Quando disponíveis, podem apresentar novidades, promoções e outros conteúdos por tempo limitado.', link: { label: 'Ir para o início', url: '/' }, terms: ['stories', 'story', 'historias'] },
  { question: 'Como encontrar lugares públicos?', answer: 'Na página inicial, use Aonde ir? para explorar lugares públicos e sugestões cadastradas na plataforma.', link: { label: 'Ir para o início', url: '/' }, terms: ['lugares', 'publicos', 'pracas', 'parques', 'aonde'] },
  { question: 'Como funciona o canal informativo?', answer: 'O Canal Informativo reúne publicações e comunicados disponíveis no Saj Tem. Confira a data e a origem de cada publicação.', link: { label: 'Abrir canal', url: '/canal-informativo' }, terms: ['canal', 'informativo', 'noticias', 'comunicados'] },
  { question: 'Posso usar o app offline?', answer: 'Algumas páginas já abertas podem ficar disponíveis sem conexão, mas buscas, dados recentes e ações que dependem do servidor exigem internet. Instalar o PWA não torna todo o site offline.', link: { label: 'Ver ajuda', url: '/help' }, terms: ['offline', 'internet', 'conexao', 'pwa'] },
  { question: 'Como receber notificações?', answer: 'Entre na sua conta e confira as preferências de notificações. Para avisos fora do site, também é preciso permitir notificações neste navegador ou PWA; a disponibilidade depende do dispositivo.', link: { label: 'Configurações', url: '/configuracoes' }, terms: ['notificacoes', 'notificacao', 'avisos', 'push'] },
];

function normalizedWords(value: string): string[] {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
    .map(word => word.endsWith('s') && word.length > 4 ? word.slice(0, -1) : word);
}

export function findSiteFaq(message: string): SiteFaq | null {
  const query = new Set(normalizedWords(message));
  if (!query.size) return null;
  const scored = siteFaq.map(item => ({ item, score: normalizedWords(item.terms.join(' ')).filter(term => query.has(term)).length }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  // A single generic word (for example "local") must not trigger a canned answer.
  const distinctive = ['avaliar', 'avaliacao', 'cupom', 'favoritar', 'favorito', 'vaga', 'emprego', 'evento', 'story', 'storie', 'offline', 'pwa', 'notificacao', 'notificacoe', 'push'];
  return best && (best.score >= 2 || (best.score === 1 && distinctive.some(term => query.has(term) && normalizedWords(best.item.terms.join(' ')).includes(term))))
    ? best.item : null;
}
