import { supabase } from '@/integrations/supabase/client';

export const TRACKED_TOOL_SLUGS = [
  'gerador-rifa',
  'gerador-cobranca',
  'criador-curriculo',
  'gestao-cobrancas',
  'calculadora-orcamento',
  'calculadora-margem',
  'simulador-rescisao',
  'leitor-voz',
  'consulta-fipe',
] as const;

const trackedToolSlugs = new Set<string>(TRACKED_TOOL_SLUGS);

const getToolSlug = (pathname: string) => {
  const match = pathname.match(/^\/ferramentas\/([^/]+)\/?$/i);
  if (!match) return null;

  const slug = match[1].toLowerCase();
  return trackedToolSlugs.has(slug) ? slug : null;
};

export const trackToolView = async (pathname: string) => {
  const toolSlug = getToolSlug(pathname);
  if (!toolSlug) return;

  const storageKey = `sajtem:tool-view:${toolSlug}`;

  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, 'pending');
  } catch {
    // A contagem continua mesmo quando o navegador bloqueia o sessionStorage.
  }

  const { error } = await supabase.rpc('increment_tool_view' as any, {
    p_tool_slug: toolSlug,
  } as any);

  if (error) {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Sem ação: o armazenamento pode estar indisponível neste navegador.
    }
    console.error('Erro ao registrar visualização da ferramenta:', error);
    return;
  }

  try {
    sessionStorage.setItem(storageKey, 'counted');
  } catch {
    // Sem ação: a visualização já foi registrada no servidor.
  }
};
