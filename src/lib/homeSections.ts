export interface HomeSection {
  id: string;
  section_name: string;
  display_name: string;
  ordem: number;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

// All sections rendered by HomeContent or supplied by Index.extraSections.
export const HOME_SECTIONS = {
  stories: { name: 'Stories', description: 'Stories publicados e disponíveis.' },
  enquetes: { name: 'Enquetes', description: 'Aparece quando existe uma enquete ativa.' },
  search: { name: 'Barra de Busca', description: 'Busca de empresas, produtos e serviços.' },
  aonde_ir: { name: 'Aonde ir?', description: 'Atalho para descobrir lugares na cidade.' },
  banner: { name: 'Banner Principal', description: 'Banners ativos configurados para a página inicial.' },
  featured_section: { name: 'Seção em Destaque', description: 'Locais em destaque disponíveis na cidade.' },
  categories: { name: 'Categorias', description: 'Categorias de empresas e serviços.' },
  jogos: { name: 'Dominó / Jogos', description: 'Apresentação do dominó e acesso à página de jogos.' },
  voz_do_povo: { name: 'Voz do Povo', description: 'Relatos públicos ou convite para enviar um relato.' },
  featured_products: { name: 'Produtos em Destaque', description: 'Depende de produtos disponíveis cadastrados pelas empresas.' },
  canal_informativo: { name: 'Canal Informativo', description: 'Última publicação disponível no canal.' },
  achados_perdidos: { name: 'Achados e Perdidos', description: 'Publicações recentes ou aviso de nenhum objeto encontrado.' },
  ferramentas: { name: 'Central de Ferramentas', description: 'Rifas primeiro; demais ferramentas por visualizações.' },
  eventos_slider: { name: 'Slider de Eventos', description: 'Depende de eventos disponíveis para exibição.' },
  stats_section: { name: 'Banner adicional', description: 'Segundo espaço de banners da inicial. Apesar do identificador antigo, não exibe estatísticas.' },
  latest_job_coupons: { name: 'Últimas Vagas de Emprego', description: 'Depende de vagas ativas disponíveis na cidade.' },
  popular_businesses: { name: 'Empresas Populares', description: 'Grade adicional de locais em destaque; pode repetir locais da seção Em Destaque.' },
  latest_coupons: { name: 'Últimos Cupons', description: 'Depende de cupons disponíveis na cidade.' },
} as const;

export type HomeSectionName = keyof typeof HOME_SECTIONS;
export const isHomeSectionName = (name: string): name is HomeSectionName =>
  Object.prototype.hasOwnProperty.call(HOME_SECTIONS, name);

export function sortHomeSections(sections: HomeSection[]) {
  return [...sections].sort((a, b) => a.ordem - b.ordem || a.section_name.localeCompare(b.section_name));
}

export function getPublicHomeSections(rows: HomeSection[]) {
  return sortHomeSections(rows.filter(section => section.ativo && isHomeSectionName(section.section_name)));
}

export function getAdminHomeSections(rows: HomeSection[]) {
  const sections = sortHomeSections(rows);
  const names = new Set(rows.map(section => section.section_name));
  let nextOrder = Math.max(0, ...rows.map(section => section.ordem));
  for (const [name, definition] of Object.entries(HOME_SECTIONS)) {
    if (!names.has(name)) {
      // Missing entries are only offered to admins. Never resurrect hidden
      // entries for public readers: RLS intentionally omits inactive rows.
      sections.push({ id: `pending:${name}`, section_name: name, display_name: definition.name, ordem: ++nextOrder, ativo: false });
    }
  }
  return sections;
}

export function serializeHomeSections(sections: HomeSection[]) {
  if (!sections.length || new Set(sections.map(section => section.section_name)).size !== sections.length) {
    throw new Error('A lista de seções está vazia ou contém duplicatas. Recarregue o painel.');
  }
  return sections.map((section, index) => ({
    // The unique section_name identifies an upsert; temporary IDs never go to Postgres.
    section_name: section.section_name,
    display_name: section.section_name === 'stats_section' ? HOME_SECTIONS.stats_section.name : section.display_name,
    ordem: index + 1,
    ativo: section.ativo,
  }));
}
