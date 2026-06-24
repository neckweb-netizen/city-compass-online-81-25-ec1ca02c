import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminCidades = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cidadesQuery = useQuery({
    queryKey: ['admin-cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const toggleCidadeMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('cidades')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cidades'] });
      toast({ title: 'Cidade atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar cidade', variant: 'destructive' });
    },
  });

  return {
    cidades: cidadesQuery.data || [],
    loading: cidadesQuery.isLoading,
    toggleCidade: toggleCidadeMutation.mutate,
    refetch: cidadesQuery.refetch,
  };
};