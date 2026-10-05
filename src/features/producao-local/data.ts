export interface ProducaoCultura {
  nome: string;
  areaHectares: number;
  quantidadeToneladas: number;
  valorReais: number;
  participacao: number;
  termos: string[];
}

export interface RebanhoLocal {
  nome: string;
  quantidade: number;
  unidade: string;
}

export const INDICADORES_PRODUCAO = [
  { rotulo: 'Produção agrícola', valor: 'R$ 27,2 mi', detalhe: 'valor total das lavouras', fonte: 'IBGE PAM 2025' },
  { rotulo: 'Principal cultura', valor: '238 t', detalhe: 'cacau produzido', fonte: 'IBGE PAM 2025' },
  { rotulo: 'Rebanho bovino', valor: '18.793', detalhe: 'cabeças', fonte: 'IBGE PPM 2024' },
  { rotulo: 'Produção de leite', valor: '494 mil L', detalhe: 'por ano', fonte: 'IBGE PPM 2024' },
  { rotulo: 'Produção de mel', valor: '290 kg', detalhe: 'por ano', fonte: 'IBGE PPM 2024' },
  { rotulo: 'Agricultura familiar', valor: '1.996', detalhe: 'de 2.715 estabelecimentos', fonte: 'Censo Agro 2017' },
] as const;

export const CULTURAS_PRODUCAO: ProducaoCultura[] = [
  { nome: 'Cacau', areaHectares: 356, quantidadeToneladas: 238, valorReais: 11_100_000, participacao: 41, termos: ['cacau', 'chocolate'] },
  { nome: 'Laranja', areaHectares: 792, quantidadeToneladas: 7465, valorReais: 7_950_000, participacao: 29, termos: ['laranja', 'cítrico', 'citricos'] },
  { nome: 'Mandioca', areaHectares: 562, quantidadeToneladas: 4108, valorReais: 2_490_000, participacao: 9.2, termos: ['mandioca', 'aipim', 'farinha'] },
  { nome: 'Tangerina', areaHectares: 285, quantidadeToneladas: 1236, valorReais: 1_680_000, participacao: 6.2, termos: ['tangerina', 'mexerica'] },
  { nome: 'Milho verde', areaHectares: 26, quantidadeToneladas: 145, valorReais: 1_210_000, participacao: 4.4, termos: ['milho', 'milho verde'] },
  { nome: 'Amendoim', areaHectares: 158, quantidadeToneladas: 229, valorReais: 930_000, participacao: 3.4, termos: ['amendoim'] },
  { nome: 'Banana', areaHectares: 82, quantidadeToneladas: 320, valorReais: 614_000, participacao: 2.3, termos: ['banana'] },
  { nome: 'Alface', areaHectares: 2, quantidadeToneladas: 29, valorReais: 369_000, participacao: 1.4, termos: ['alface', 'hortaliça', 'hortalica'] },
  { nome: 'Cana-de-açúcar', areaHectares: 31, quantidadeToneladas: 646, valorReais: 282_000, participacao: 1, termos: ['cana', 'cana-de-açúcar', 'cana de açúcar'] },
  { nome: 'Maracujá', areaHectares: 17, quantidadeToneladas: 81, valorReais: 187_000, participacao: 0.7, termos: ['maracujá', 'maracuja'] },
];

export const REBANHOS_PRODUCAO: RebanhoLocal[] = [
  { nome: 'Aves', quantidade: 887_300, unidade: 'cabeças' },
  { nome: 'Bovinos', quantidade: 18_793, unidade: 'cabeças' },
  { nome: 'Suínos', quantidade: 10_105, unidade: 'cabeças' },
  { nome: 'Ovinos', quantidade: 2_158, unidade: 'cabeças' },
  { nome: 'Equinos', quantidade: 802, unidade: 'cabeças' },
  { nome: 'Caprinos', quantidade: 624, unidade: 'cabeças' },
  { nome: 'Bubalinos', quantidade: 136, unidade: 'cabeças' },
];

export const FONTES_PRODUCAO = [
  { nome: 'Produção Agrícola Municipal — PAM', ano: '2025', orgao: 'IBGE', url: 'https://sidra.ibge.gov.br/pesquisa/pam/tabelas' },
  { nome: 'Pesquisa da Pecuária Municipal — PPM', ano: '2024', orgao: 'IBGE', url: 'https://sidra.ibge.gov.br/pesquisa/ppm/tabelas' },
  { nome: 'Censo Agropecuário', ano: '2017', orgao: 'IBGE', url: 'https://sidra.ibge.gov.br/pesquisa/censo-agropecuario/censo-agropecuario-2017' },
  { nome: 'Cadastro Nacional da Agricultura Familiar — CAF', ano: '2026', orgao: 'MDA', url: 'https://www.gov.br/mda/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/cadastro-nacional-da-agricultura-familiar/transparencia' },
  { nome: 'Cadastro Nacional de Produtores Orgânicos — CNPO', ano: '2026', orgao: 'MAPA', url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/organicos/cadastro-nacional-de-produtores-organicos-cnpo' },
] as const;

export const PERFIL_AGRICULTURA_FAMILIAR = [
  { atividade: 'Lavouras temporárias', estabelecimentos: 992 },
  { atividade: 'Lavouras permanentes', estabelecimentos: 881 },
  { atividade: 'Pecuária', estabelecimentos: 708 },
  { atividade: 'Horticultura e floricultura', estabelecimentos: 113 },
] as const;

export const formatarMoedaCompacta = (valor: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 2,
}).format(valor);

export const formatarNumero = (valor: number) => new Intl.NumberFormat('pt-BR').format(valor);
