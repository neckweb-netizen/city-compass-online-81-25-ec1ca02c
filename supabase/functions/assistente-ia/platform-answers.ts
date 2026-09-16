export type PlatformAnswer = { text: string; links: { label: string; url: string }[] };

// Factual answers about the site, independent of commercial eligibility.
// Keep these aligned with the published routes and Terms of Use.
export function platformAnswer(message: string): PlatformAnswer | null {
  const text = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const aboutSite = /\b(saj\s*tem|site|plataforma|aplicativo|app)\b/.test(text);
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
