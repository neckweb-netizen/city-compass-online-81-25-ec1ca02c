
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Plano = Tables<'planos'>;
type PlanoInsert = TablesInsert<'planos'>;
type PlanoUpdate = TablesUpdate<'planos'>;

export const useAdminPlanos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: planos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-planos'],
    queryFn: async () => {
      console.log('🔄 Buscando planos...');
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('preco_mensal', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar planos:', error);
        throw error;
      }

      console.log('✅ Planos carregados:', data);
      return data;
    },
  });

  const createPlano = useMutation({
    mutationFn: async (novoPlano: PlanoInsert) => {
      console.log('➕ Criando plano:', novoPlano);
      const { data, error } = await supabase
        .from('planos')
        .insert(novoPlano)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar plano:', error);
        throw error;
      }

      console.log('✅ Plano criado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planos'] });
      toast({
        title: 'Sucesso',
        description: 'Plano criado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('❌ Erro na mutação de criação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar plano. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updatePlano = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: PlanoUpdate }) => {
      console.log('✏️ Atualizando plano:', id, dados);
      const { data, error } = await supabase
        .from('planos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar plano:', error);
        throw error;
      }

      console.log('✅ Plano atualizado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planos'] });
      toast({
        title: 'Sucesso',
        description: 'Plano atualizado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('❌ Erro na mutação de atualização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar plano. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deletePlano = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Excluindo plano:', id);
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir plano:', error);
        throw error;
      }

      console.log('✅ Plano excluído');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planos'] });
      toast({
        title: 'Sucesso',
        description: 'Plano excluído com sucesso!',
      });
    },
    onError: (error) => {
      console.error('❌ Erro na mutação de exclusão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir plano. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return {
    planos,
    isLoading,
    error,
    createPlano,
    updatePlano,
    deletePlano,
  };
};
