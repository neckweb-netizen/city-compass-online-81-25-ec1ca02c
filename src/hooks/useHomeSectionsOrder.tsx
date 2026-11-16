import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAdminHomeSections, getPublicHomeSections, serializeHomeSections, type HomeSection } from '@/lib/homeSections';
import { toast } from 'sonner';

export type { HomeSection } from '@/lib/homeSections';

export const useHomeSectionsOrder = (mode: 'public' | 'admin' = 'public') => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Public order is identical for guests and signed-in users. Reuse its cache
  // instead of fetching a second time when auth finishes initializing.
  const queryKey = mode === 'public'
    ? ['home-sections-order', 'public']
    : ['home-sections-order', 'admin', user?.id ?? 'anonymous'];
  const query = useQuery({
    queryKey,
    staleTime: mode === 'public' ? 5 * 60_000 : 0,
    refetchOnMount: mode === 'public' ? false : 'always',
    refetchOnWindowFocus: true,
    refetchInterval: false,
    queryFn: async () => {
      if (mode === 'public') {
        // One anonymous response shared by all visitors through the Vercel CDN.
        const response = await fetch('/api/public-catalog?resource=home-sections');
        if (!response.ok) throw new Error('Falha ao consultar seções públicas');
        const data = await response.json() as HomeSection[];
        return getPublicHomeSections(data);
      }
      // Admin visibility must stay user-scoped and never touch the public CDN.
      const { data, error } = await supabase.from('home_sections_order')
        .select('*')
        .order('ordem', { ascending: true })
        .order('section_name', { ascending: true });
      if (error) throw error;
      return getAdminHomeSections(data);
    },
  });

  const reorderSections = useMutation({
    mutationFn: async (sections: HomeSection[]) => {
      if (mode !== 'admin') throw new Error('Abra o painel administrativo para salvar as seções.');
      // One bulk statement commits every position/visibility together or none.
      // Existing RLS and MFA policies continue to authorize the operation.
      const updates = serializeHomeSections(sections);
      const { data, error } = await supabase.from('home_sections_order')
        .upsert(updates, { onConflict: 'section_name' }).select('*');
      if (error) throw error;
      if (data.length !== updates.length) throw new Error('Não foi possível confirmar todas as seções salvas. Recarregue o painel.');
      return getAdminHomeSections(data);
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(queryKey, saved);
      await queryClient.invalidateQueries({ queryKey: ['home-sections-order'] });
      toast.success('Ordem e visibilidade salvas com sucesso!');
    },
    onError: (error) => toast.error('Não foi possível salvar as seções: ' + error.message),
  });

  return { sections: query.data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, reorderSections };
};
