import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface ServicoAgendamento {
  id: string;
  empresa_id: string;
  nome_servico: string;
  descricao?: string;
  duracao_minutos: number;
  preco?: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useServicosAgendamento = (empresaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos-agendamento', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('servicos_agendamento')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome_servico');

      if (error) throw error;
      return data as ServicoAgendamento[];
    },
    enabled: !!empresaId,
  });

  const criarServico = useMutation({
    mutationFn: async (dados: {
      empresa_id: string;
      nome_servico: string;
      descricao?: string;
      duracao_minutos: number;
      preco?: number;
    }) => {
      const { data, error } = await supabase
        .from('servicos_agendamento')
        .insert(dados)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-agendamento'] });
      toast({
        title: 'Serviço criado!',
        description: 'Serviço de agendamento foi criado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar serviço:', error);
      toast({
        title: 'Erro ao criar serviço',
        description: 'Não foi possível criar o serviço. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const atualizarServico = useMutation({
    mutationFn: async ({ id, dados }: { 
      id: string; 
      dados: Partial<ServicoAgendamento> 
    }) => {
      const { error } = await supabase
        .from('servicos_agendamento')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-agendamento'] });
      toast({
        title: 'Serviço atualizado',
        description: 'As informações do serviço foram atualizadas.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o serviço.',
        variant: 'destructive',
      });
    },
  });

  const excluirServico = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('servicos_agendamento')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos-agendamento'] });
      toast({
        title: 'Serviço excluído',
        description: 'O serviço foi removido com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o serviço.',
        variant: 'destructive',
      });
    },
  });

  return {
    servicos: servicos || [],
    isLoading,
    criarServico: criarServico.mutate,
    atualizarServico: atualizarServico.mutate,
    excluirServico: excluirServico.mutate,
    isCreating: criarServico.isPending,
    isUpdating: atualizarServico.isPending,
    isDeleting: excluirServico.isPending,
  };
};