import type { Tables } from '@/integrations/supabase/types';

export type Plano = Tables<'planos'>;

export const limiteIlimitado = (valor: number | null | undefined) =>
  typeof valor === 'number' && valor < 0;

export const formatarLimitePlano = (valor: number | null | undefined) =>
  limiteIlimitado(valor) ? 'Ilimitado' : String(Math.max(0, valor ?? 0));

export const planoGratuito = (plano: Pick<Plano, 'nome' | 'preco_mensal'>) =>
  plano.nome.toLocaleLowerCase('pt-BR').includes('gratuito');

export const planoEmpresarial = (plano: Pick<Plano, 'nome'>) =>
  plano.nome.toLocaleLowerCase('pt-BR').includes('empresarial');

export const formatarPrecoPlano = (plano: Pick<Plano, 'nome' | 'preco_mensal'>) => {
  if (planoEmpresarial(plano) && Number(plano.preco_mensal) === 0) return 'Sob consulta';
  if (planoGratuito(plano)) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plano.preco_mensal));
};

export const ordenarPlanos = (planos: Plano[]) =>
  [...planos].sort((a, b) => {
    if (planoGratuito(a)) return -1;
    if (planoGratuito(b)) return 1;
    if (planoEmpresarial(a)) return 1;
    if (planoEmpresarial(b)) return -1;
    return Number(a.preco_mensal) - Number(b.preco_mensal);
  });
