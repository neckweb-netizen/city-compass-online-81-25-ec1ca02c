
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MenuConfiguracao {
  id: string;
  nome_item: string;
  rota: string;
  icone: string;
  posicao_desktop: 'sidebar' | 'bottom';
  posicao_mobile: 'hamburger' | 'bottom';
  ordem: number;
  ativo: boolean;
  apenas_admin: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useMenuConfiguracoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configuracoes, isLoading } = useQuery({
    queryKey: ['menu-configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_configuracoes')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) {
        console.error('Error fetching menu configurations:', error);
        throw error;
      }

      return data as MenuConfiguracao[];
    },
  });

  const updateConfiguracao = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MenuConfiguracao> }) => {
      const { data, error } = await supabase
        .from('menu_configuracoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-configuracoes'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações do menu foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating menu configuration:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar configuração do menu.',
        variant: 'destructive',
      });
    },
  });

  const createConfiguracao = useMutation({
    mutationFn: async (newConfig: Omit<MenuConfiguracao, 'id' | 'criado_em' | 'atualizado_em'>) => {
      const { data, error } = await supabase
        .from('menu_configuracoes')
        .insert([newConfig])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-configuracoes'] });
      toast({
        title: 'Item criado',
        description: 'Novo item de menu criado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error creating menu configuration:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar item de menu.',
        variant: 'destructive',
      });
    },
  });

  return {
    configuracoes: configuracoes || [],
    isLoading,
    updateConfiguracao: updateConfiguracao.mutate,
    createConfiguracao: createConfiguracao.mutate,
    isUpdating: updateConfiguracao.isPending,
    isCreating: createConfiguracao.isPending,
  };
};
