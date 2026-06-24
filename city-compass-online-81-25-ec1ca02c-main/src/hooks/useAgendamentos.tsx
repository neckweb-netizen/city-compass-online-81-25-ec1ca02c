import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Agendamento {
  id: string;
  empresa_id: string;
  nome_cliente: string;
  telefone_cliente: string;
  servico: string;
  data_agendamento: string;
  observacoes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  criado_em: string;
  atualizado_em: string;
}

export const useAgendamentos = (empresaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_agendamento', { ascending: true });

      if (error) throw error;
      return data as Agendamento[];
    },
    enabled: !!empresaId,
  });

  const criarAgendamento = useMutation({
    mutationFn: async (dados: {
      empresa_id: string;
      nome_cliente: string;
      telefone_cliente: string;
      servico: string;
      data_agendamento: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(dados)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast({
        title: 'Agendamento criado!',
        description: 'Seu agendamento foi solicitado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: 'Erro ao agendar',
        description: 'Não foi possível criar o agendamento. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do agendamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  return {
    agendamentos: agendamentos || [],
    isLoading,
    criarAgendamento: criarAgendamento.mutate,
    atualizarStatus: atualizarStatus.mutate,
    isCreating: criarAgendamento.isPending,
    isUpdating: atualizarStatus.isPending,
  };
};