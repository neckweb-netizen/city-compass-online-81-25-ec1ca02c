export const BANNER_SECTION_VALUES = [
  'home',
  'empresas',
  'eventos',
  'categorias',
  'busca',
  'canal_video',
  'domino',
  'ferramentas',
  'gerador_rifa',
  'gerador_cobranca',
  'criador_curriculo',
  'gestao_cobrancas',
  'calculadora_orcamento',
  'calculadora_margem',
  'simulador_rescisao',
  'leitor_voz',
] as const;

export type BannerSection = typeof BANNER_SECTION_VALUES[number];

export const BANNER_SECTION_OPTIONS: ReadonlyArray<{ value: BannerSection; label: string }> = [
  { value: 'home', label: 'Página Inicial' },
  { value: 'empresas', label: 'Locais' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'busca', label: 'Busca' },
  { value: 'canal_video', label: 'Canal Informativo - Vídeos' },
  { value: 'domino', label: 'Jogo Dominó' },
  { value: 'ferramentas', label: 'Central de Ferramentas (Catálogo Geral)' },
  { value: 'gerador_rifa', label: 'Ferramenta - Gerador & Caderno de Rifas' },
  { value: 'gerador_cobranca', label: 'Ferramenta - Gerador de Cobrança PIX' },
  { value: 'criador_curriculo', label: 'Ferramenta - Criador de Currículo PDF' },
  { value: 'gestao_cobrancas', label: 'Ferramenta - Gestão de Cobranças (Micro CRM)' },
  { value: 'calculadora_orcamento', label: 'Ferramenta - Calculadora de Orçamento' },
  { value: 'calculadora_margem', label: 'Ferramenta - Calculadora de Maquininha & Margem' },
  { value: 'simulador_rescisao', label: 'Ferramenta - Simulador de Rescisão (CLT)' },
  { value: 'leitor_voz', label: 'Ferramenta - Leitor de Texto em Voz Alta' },
];
