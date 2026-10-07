import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cardapio } from '@/features/cardapio/types';

const cardapioSelect = '*,cardapio_itens(*)';

export const useMyCardapio = (userId?: string) => useQuery({
  queryKey: ['cardapio-digital', 'meu', userId],
  enabled: Boolean(userId),
  queryFn: async () => {
    const { data, error } = await supabase.from('cardapios' as any)
      .select(cardapioSelect)
      .eq('user_id', userId)
      .order('ordem', { referencedTable: 'cardapio_itens', ascending: true })
      .maybeSingle();
    if (error) throw error;
    return data as Cardapio | null;
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
