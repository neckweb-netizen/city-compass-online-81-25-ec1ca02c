
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmpresaStories = () => {
  return useQuery({
    queryKey: ['empresa-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresa_stories')
        .select(`
          *,
          empresas(
            id,
            nome,
            imagem_capa_url,
            slug
          )
        `)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAdminEmpresaStories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ['admin-empresa-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresa_stories')
        .select(`
          *,
          empresas(
            id,
            nome,
            imagem_capa_url,
            slug
          )
        `)
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: {
      empresa_id?: string | null;
      tipo_story: 'empresa' | 'sistema';
      nome_perfil_sistema?: string;
      tipo_midia?: 'imagem' | 'video';
      url_midia: string;
      imagem_story_url?: string;
      imagem_capa_url?: string;
      duracao?: number;
      ordem?: number;
      botao_titulo?: string;
      botao_link?: string;
      botao_tipo?: string;
    }) => {
      const storyData = {
        ...data,
        // Manter compatibilidade com imagem_story_url se url_midia não estiver definida
        imagem_story_url: data.imagem_story_url || data.url_midia,
      };
      
      const { error } = await supabase
        .from('empresa_stories')
        .insert(storyData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresa-stories'] });
      queryClient.invalidateQueries({ queryKey: ['empresa-stories'] });
      toast({ title: 'Story criado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao criar story:', error);
      toast({ 
        title: 'Erro ao criar story', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      imagem_story_url?: string;
      url_midia?: string;
      tipo_midia?: string;
      nome_perfil_sistema?: string;
      imagem_capa_url?: string;
      duracao?: number;
      ordem?: number;
      ativo?: boolean;
      botao_titulo?: string;
      botao_link?: string;
      botao_tipo?: string;
    }) => {
      // Criar objeto apenas com campos definidos (não undefined)
      const updateData: any = {};
      
      // Incluir apenas campos que têm valores definidos
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });
      
      // Se imagem_story_url for fornecida, usar como url_midia também
      if (updateData.imagem_story_url && !updateData.url_midia) {
        updateData.url_midia = updateData.imagem_story_url;
      }
      
      // Garantir que não estamos enviando campos vazios
      if (Object.keys(updateData).length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }
      
      const { error } = await supabase
        .from('empresa_stories')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresa-stories'] });
      queryClient.invalidateQueries({ queryKey: ['empresa-stories'] });
      toast({ title: 'Story atualizado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar story:', error);
      toast({ 
        title: 'Erro ao atualizar story', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresa_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresa-stories'] });
      queryClient.invalidateQueries({ queryKey: ['empresa-stories'] });
      toast({ title: 'Story removido com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao remover story:', error);
      toast({ 
        title: 'Erro ao remover story', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  return {
    stories: storiesQuery.data || [],
    loading: storiesQuery.isLoading,
    createStory: createStoryMutation.mutate,
    updateStory: updateStoryMutation.mutate,
    deleteStory: deleteStoryMutation.mutate,
    refetch: storiesQuery.refetch,
  };
};
