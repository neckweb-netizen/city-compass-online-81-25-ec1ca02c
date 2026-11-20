
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
      const { data: updated, error } = await supabase
        .from('cupons').update({ ativo }).eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      if (!updated) throw new Error('Cupom não encontrado ou sem permissão para atualizar.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-cupons'] });
      toast({ title: 'Cupom atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar cupom', variant: 'destructive' });
    },
  });

  const deleteCupomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: removed, error } = await supabase
        .from('cupons').delete().eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      if (!removed) throw new Error('Cupom não encontrado ou sem permissão para excluir.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-cupons'] });
      toast({ title: 'Cupom removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover cupom', variant: 'destructive' });
    },
  });

  return {
    cupons: cuponsQuery.data || [],
    loading: cuponsQuery.isLoading,
    error: cuponsQuery.error,
    isProcessing: toggleCupomMutation.isPending || deleteCupomMutation.isPending,
    toggleCupom: toggleCupomMutation.mutate,
    deleteCupom: deleteCupomMutation.mutate,
    refetch: cuponsQuery.refetch,
  };
};
