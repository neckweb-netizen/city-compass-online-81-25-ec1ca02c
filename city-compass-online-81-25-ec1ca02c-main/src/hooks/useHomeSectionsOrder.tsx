import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HomeSection {
  id: string;
  section_name: string;
  display_name: string;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useHomeSectionsOrder = () => {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['home-sections-order'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections_order')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as HomeSection[];
    }
  });

  const updateSectionOrder = useMutation({
    mutationFn: async ({ sectionId, newOrder }: { sectionId: string; newOrder: number }) => {
      const { error } = await supabase
        .from('home_sections_order')
        .update({ ordem: newOrder })
        .eq('id', sectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections-order'] });
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ordem: ' + error.message);
    }
  });

  const toggleSectionVisibility = useMutation({
    mutationFn: async ({ sectionId, ativo }: { sectionId: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('home_sections_order')
        .update({ ativo })
        .eq('id', sectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections-order'] });
      toast.success('Visibilidade atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar visibilidade: ' + error.message);
    }
  });

  const reorderSections = useMutation({
    mutationFn: async (newSections: HomeSection[]) => {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        ordem: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('home_sections_order')
          .update({ ordem: update.ordem })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections-order'] });
      toast.success('Ordem das seções atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao reordenar seções: ' + error.message);
    }
  });

  return {
    sections,
    isLoading,
    updateSectionOrder,
    toggleSectionVisibility,
    reorderSections
  };
};