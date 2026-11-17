
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCidades = (enabled = true) => {
  return useQuery({
    queryKey: ['cidades'],
    enabled,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const response = await fetch('/api/public-catalog?resource=cities');
      if (!response.ok) throw new Error('Não foi possível carregar as cidades.');
      return await response.json() as import('@/integrations/supabase/types').Tables<'cidades'>[];

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
