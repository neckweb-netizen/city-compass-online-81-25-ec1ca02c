export type PlatformAnswer = { text: string; links: { label: string; url: string }[] };

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function currentBahiaTime(now: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

// Factual answers about the site, independent of commercial eligibility.
// Keep these aligned with the published routes and Terms of Use.
export function platformAnswer(message: string, now = new Date()): PlatformAnswer | null {
  const text = normalized(message);
  const social = text.replace(/[!?.,;:]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(?:(?:oi|ola|opa|e ai|bom dia|boa tarde|boa noite)(?: (?:tudo bem|tudo bom|como vai|como voce esta|beleza))?|tudo bem|tudo bom|como vai|como voce esta|beleza)$/.test(social)) {
    return { text: "Olá! Tudo bem por aqui. Posso conversar com você sobre o Saj Tem e também ajudar em buscas locais. O que você gostaria de saber?", links: [] };
  }
  if (/^(?:(?:muito )?(?:obrigado|obrigada|valeu)(?: mesmo)?(?: pela ajuda)?|agradeco)$/.test(social)) {
    return { text: "Por nada! Se precisar de mais alguma informação sobre o Saj Tem ou os locais da cidade, é só perguntar.", links: [] };
  }
  if (/^(tchau|ate logo|ate mais|falou)$/.test(social)) {
    return { text: "Até mais! Quando precisar, posso ajudar você a explorar o Saj Tem.", links: [] };
  }
  if (/^(ajuda|me ajude|o que voce faz|no que pode ajudar)[!?. ]*$/.test(text)) {
    return { text: "Posso responder perguntas sobre o Saj Tem, explicar privacidade e recursos do site, informar a hora atual e ajudar a procurar empresas, produtos, eventos, vagas, serviços e ferramentas. Pode perguntar normalmente.", links: [] };
  }
  const asksCurrentTime = /\b(que horas sao|qual(?: e)? a hora|hora agora|horario agora)\b/.test(text);
  if (asksCurrentTime) {
    return { text: `Agora são ${currentBahiaTime(now)}, no horário de Santo Antônio de Jesus (Bahia).`, links: [] };
  }
  const onlyAsksSchedule = /^(?:(?:qual(?: e)?(?: o)?|que|tem|e o)\s+)?horario(?: de funcionamento| agora)?[!?., ]*$/.test(text);
  if (onlyAsksSchedule) {
    return { text: "Você quer saber a hora atual, o horário de funcionamento de uma empresa ou o horário de um evento?", links: [] };
  }
  if (/\b(?:essa|esta|a)?\s*(?:conversa|mensagem|dados?)\b.*\b(?:privad[ao]s?|segur[ao]s?|protegidos?)\b|\bprivacidade\b/.test(text)) {
    return {
      text: "A conversa não é pública, mas você não deve enviar senhas, documentos, dados bancários ou outras informações sensíveis. As mensagens são guardadas temporariamente para manter a conversa e aplicar controles de uso. Você pode consultar os detalhes na Política de Privacidade.",
      links: [{ label: "Política de Privacidade", url: "/politica-de-privacidade" }],
    };
  }
  if (/\b(saj\s*tem|site|plataforma|app)\b.*\b(privado|privada|privatizado|privatizada|publico|publica)\b|\b(privado|privada|privatizado|privatizada|publico|publica)\b.*\b(saj\s*tem|site|plataforma|app)\b|^(?:e|eh|isso e)\s+(?:privado|privada|privatizado|privatizada)[!?., ]*$/.test(text)) {
    return {
      text: "Se você está perguntando quem administra o Saj Tem ou qual é a natureza jurídica dele, eu não tenho essa informação confirmada e não vou inventar. Se a dúvida é sobre privacidade dos seus dados, posso explicar como a conversa é tratada.",
      links: [{ label: "Política de Privacidade", url: "/politica-de-privacidade" }],
    };
  }
  if (/\b(quem e voce|voce e (?:uma )?ia|voce e robo|o que voce e)\b/.test(text)) {
    return {
      text: "Sou o assistente virtual do Saj Tem. Nesta versão, respondo com regras e informações cadastradas no próprio site, sem usar o Gemini. Posso conversar sobre a plataforma e ajudar em buscas locais.",
      links: [],
    };
  }
  const aboutSite = /\b(saj\s*tem|site|plataforma|aplicativo|app)\b/.test(text);
  if (aboutSite && /\b(whatsapp|zap|telefone|numero|contato|falar com|email|e-mail)\b/.test(text)) {
    return {
      text: "O Saj Tem ainda não tem um número oficial de WhatsApp confirmado nesta versão. Para falar com a equipe, use a página Entre em Contato do site.",
      links: [{ label: "Entre em Contato", url: "/contact" }],
    };
  }
  if (/\b(empresa|perfil|selo)\s+verificad[ao]\b/.test(text)) {
    return {
      text: "Uma empresa verificada tem um selo indicado no perfil pelo Saj Tem. Isso não garante preços, qualidade ou disponibilidade: confirme as informações diretamente com a empresa.",
      links: [{ label: "Explorar locais", url: "/locais" }],
    };
  }
  if (aboutSite && /\b(produto|produtos|vende|comprar)\b/.test(text)) {
    return {
      text: "O Saj Tem pode mostrar produtos cadastrados pelas empresas em seus perfis. O catálogo e a disponibilidade dependem de cada empresa; confira o perfil e confirme antes de comprar.",
      links: [{ label: "Explorar locais", url: "/locais" }],
    };
  }
  if (aboutSite && /\b(o que|que e|qual e|como funciona|serve|faz|conhecer)\b/.test(text)) {
    return {
      text: "O Saj Tem é uma plataforma local que conecta pessoas, empresas e iniciativas de Santo Antônio de Jesus e região. Você pode explorar locais, eventos, oportunidades e ferramentas do site. Em que parte posso ajudar?",
      links: [{ label: "Explorar locais", url: "/locais" }, { label: "Ver ferramentas", url: "/ferramentas" }],
    };
  }
  if (/\b(quais|mostrar|ver|tem)\b.*\bferramentas\b|\bferramentas\b.*\b(site|saj\s*tem)\b/.test(text)) {
    return {
      text: "O Saj Tem oferece ferramentas digitais, como rifas, consultas e calculadoras. Veja a lista atualizada no catálogo de ferramentas.",
      links: [{ label: "Ver ferramentas", url: "/ferramentas" }],
    };
  }
  if (/\b(qual|que|o que)\b.*\bprograma\b/.test(text)) {
    return {
      text: "Você quer saber sobre o Saj Tem, sobre um plano para empresas ou sobre alguma ferramenta específica? Diga qual deles e eu ajudo a encontrar.",
      links: [{ label: "Conhecer o Saj Tem", url: "/" }, { label: "Ver ferramentas", url: "/ferramentas" }],
    };
  }
  return null;
}

export function conversationalFallback(): PlatformAnswer {
  return {
    text: "Ainda não entendi exatamente o que você quer saber. Pode explicar com outras palavras? Posso conversar sobre o Saj Tem ou, se você quiser uma busca local, diga o nome ou o tipo de empresa, produto, evento, vaga ou serviço.",
    links: [],
  };
}
