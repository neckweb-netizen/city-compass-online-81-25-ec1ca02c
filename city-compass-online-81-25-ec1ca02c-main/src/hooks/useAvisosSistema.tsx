
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAvisosSistema = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const avisosQuery = useQuery({
    queryKey: ['avisos-sistema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos_sistema')
        .select(`
          *,
          usuarios!avisos_sistema_autor_id_fkey(nome)
        `)
        .eq('ativo', true)
        .order('prioridade', { ascending: false })
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const criarAvisoMutation = useMutation({
    mutationFn: async (dados: {
      titulo: string;
      conteudo?: string;
      tipo_aviso: string;
      botoes?: Array<{texto: string; link: string; cor?: string}>;
      data_inicio?: string;
      data_fim?: string;
      prioridade?: number;
    }) => {
      const { error } = await supabase
        .from('avisos_sistema')
        .insert({
          ...dados,
          autor_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos-sistema'] });
      toast({ title: 'Aviso criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar aviso', variant: 'destructive' });
    },
  });

  const atualizarAvisoMutation = useMutation({
    mutationFn: async ({ id, ...dados }: { id: string } & any) => {
      const { error } = await supabase
        .from('avisos_sistema')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos-sistema'] });
      toast({ title: 'Aviso atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar aviso', variant: 'destructive' });
    },
  });

  const deletarAvisoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avisos_sistema')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos-sistema'] });
      toast({ title: 'Aviso removido com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover aviso', variant: 'destructive' });
    },
  });

  return {
    avisos: avisosQuery.data || [],
    loading: avisosQuery.isLoading,
    criarAviso: criarAvisoMutation.mutate,
    atualizarAviso: atualizarAvisoMutation.mutate,
    deletarAviso: deletarAvisoMutation.mutate,
    refetch: avisosQuery.refetch,
  };
};
