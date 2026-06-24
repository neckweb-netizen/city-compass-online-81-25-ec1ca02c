import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminEventos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventosQuery = useQuery({
    queryKey: ['admin-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          categorias(nome),
          cidades(nome, estado),
          empresas(nome)
        `)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleEventoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('eventos')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-eventos'] });
      toast({ title: 'Evento atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar evento', variant: 'destructive' });
    },
  });

  return {
    eventos: eventosQuery.data || [],
    loading: eventosQuery.isLoading,
    toggleEvento: toggleEventoMutation.mutate,
    refetch: eventosQuery.refetch,
  };
};