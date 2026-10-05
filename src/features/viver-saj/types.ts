export type ViverSajModuleKey = 'desejos' | 'saude' | 'feito_saj' | 'agora' | 'inovacao' | 'mobilidade';

export interface ViverSajModule {
  chave: ViverSajModuleKey;
  titulo: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
  atualizado_em: string;
}

export interface HealthService {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  endereco: string | null;
  bairro: string | null;
  telefone: string | null;
  horario: string | null;
  atendimento_sus: boolean;
  atendimento_24h: boolean;
  servicos: string[];
  fonte_nome: string | null;
  fonte_url: string | null;
  verificado_em: string | null;
  ativo: boolean;
}

export interface LocalRequest {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  bairro: string | null;
  faixa_orcamento: string | null;
  prazo: string | null;
  receber_ofertas: boolean;
  status: 'aberto' | 'atendido' | 'encerrado' | 'rejeitado';
  criado_em: string;
  pedido_local_respostas?: Array<{
    id: string;
    mensagem: string;
    preco_estimado: string | null;
    status: string;
    criado_em: string;
    empresas: { nome: string; slug: string } | null;
  }>;
}

export interface InnovationChallenge {
  id: string;
  titulo: string;
  descricao: string;
  area: string;
  proponente: string | null;
  prazo: string | null;
  status: 'rascunho' | 'publicado' | 'encerrado';
  criado_em: string;
}

export interface DirectoryBusiness {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  endereco: string | null;
  telefone: string | null;
  verificado: boolean;
  categoria?: string | null;
}

export interface ViverSajBusinessAssignment {
  modulo: ViverSajModuleKey;
  empresa_id: string;
  ordem: number;
  ativo: boolean;
  empresas: DirectoryBusiness | null;
}
