export interface CardapioItem {
  id: string;
  cardapio_id: string;
  categoria: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  disponivel: boolean;
  destaque: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Cardapio {
  id: string;
  user_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  capa_url: string | null;
  whatsapp: string | null;
  endereco: string | null;
  instagram: string | null;
  cor_primaria: string;
  aceita_pedidos: boolean;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  cardapio_itens?: CardapioItem[];
}

export const slugifyCardapio = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

export const normalizeWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
};
