
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminCupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cuponsQuery = useQuery({
    queryKey: ['admin-cupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cupons')
        .select(`
          *,
          empresas(nome, id)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleCupomMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('cupons')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
      toast({ title: 'Cupom atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar cupom', variant: 'destructive' });
    },
  });

  const deleteCupomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
      toast({ title: 'Cupom removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover cupom', variant: 'destructive' });
    },
  });

  return {
    cupons: cuponsQuery.data || [],
    loading: cuponsQuery.isLoading,
    toggleCupom: toggleCupomMutation.mutate,
    deleteCupom: deleteCupomMutation.mutate,
    refetch: cuponsQuery.refetch,
  };
};
