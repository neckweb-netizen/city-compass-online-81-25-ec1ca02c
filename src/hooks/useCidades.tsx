
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCidades = (enabled = true) => {
  return useQuery({
    queryKey: ['cidades'],
    enabled,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCidadeBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['cidade', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 15 * 60_000,
  });
};
