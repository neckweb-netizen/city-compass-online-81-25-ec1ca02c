import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cardapio } from '@/features/cardapio/types';

const cardapioSelect = '*,cardapio_itens(*)';

export interface CardapioPlanUsage {
  plano_id: string | null;
  plano_nome: string;
  limite_cardapios: number;
  cardapios_usados: number;
}

export const useMyCardapios = (userId?: string) => useQuery({
  queryKey: ['cardapio-digital', 'meus', userId],
  enabled: Boolean(userId),
  queryFn: async () => {
    const { data, error } = await supabase.from('cardapios' as any)
      .select(cardapioSelect)
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })
      .order('ordem', { referencedTable: 'cardapio_itens', ascending: true });
    if (error) throw error;
    return (data ?? []) as Cardapio[];
  },
});

export const useCardapioPlanUsage = (userId?: string) => useQuery({
  queryKey: ['cardapio-digital', 'plano', userId],
  enabled: Boolean(userId),
  queryFn: async () => {
    const { data, error } = await supabase.rpc('obter_meu_limite_cardapios');
    if (error) throw error;
    return (data?.[0] ?? null) as CardapioPlanUsage | null;
  },
});

export const usePublicCardapio = (slug?: string) => useQuery({
  queryKey: ['cardapio-digital', 'publico', slug],
  enabled: Boolean(slug),
  queryFn: async () => {
    const { data, error } = await supabase.from('cardapios' as any)
      .select(cardapioSelect)
      .eq('slug', slug)
      .eq('ativo', true)
      .eq('cardapio_itens.disponivel', true)
      .order('ordem', { referencedTable: 'cardapio_itens', ascending: true })
      .maybeSingle();
    if (error) throw error;
    return data as Cardapio | null;
  },
});
