import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomeSection {
  id: string;
  section_name: string;
  display_name: string;
  ordem: number;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
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

      let list = (data as HomeSection[]) || [];

      // Verifica se a seção de ferramentas já existe no banco
      const temFerramentas = list.some(s => s.section_name === 'ferramentas');

      if (!temFerramentas) {
        // Inclui automaticamente a seção no estado local com ID virtual/temporário
        const secaoFerramentas: HomeSection = {
          id: 'ferramentas-virtual-id',
          section_name: 'ferramentas',
          display_name: 'Central de Ferramentas',
          ordem: list.length + 1,
          ativo: true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };
        list = [...list, secaoFerramentas];
      }

      return list;
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
      if (sectionId === 'ferramentas-virtual-id') {
        const { error } = await supabase
          .from('home_sections_order')
          .upsert({
            section_name: 'ferramentas',
            display_name: 'Central de Ferramentas',
            ordem: (sections?.length || 1),
            ativo
          }, { onConflict: 'section_name' });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('home_sections_order')
          .update({ ativo })
          .eq('id', sectionId);
        
        if (error) throw error;
      }
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
        section_name: section.section_name,
        display_name: section.display_name,
        ordem: index + 1,
        ativo: section.ativo,
        ...(section.id !== 'ferramentas-virtual-id' ? { id: section.id } : {})
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('home_sections_order')
          .upsert(update, { onConflict: 'section_name' });
        
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
