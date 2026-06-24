
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notificacao {
  id: string;
  titulo: string;
  conteudo?: string;
  tipo: 'aviso' | 'avaliacao' | 'cupom' | 'evento' | 'sistema';
  lida: boolean;
  criada_em: string;
  usuario_id: string;
  referencia_id?: string;
  referencia_tipo?: string;
}

export const useNotificacoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notificacoesQuery = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar notificações diretas do usuário
      const { data: notificacoesData, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criada_em', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
      }

      // Buscar avisos do sistema ativos
      const { data: avisosData } = await supabase
        .from('avisos_sistema')
        .select('*')
        .eq('ativo', true)
        .gte('data_fim', new Date().toISOString())
        .order('prioridade', { ascending: false })
        .limit(10);

      const notificacoes: Notificacao[] = [
        ...(notificacoesData || []).map(n => ({
          id: n.id,
          titulo: n.titulo,
          conteudo: n.conteudo,
          tipo: n.tipo as any,
          lida: n.lida,
          criada_em: n.criada_em,
          usuario_id: n.usuario_id,
          referencia_id: n.referencia_id,
          referencia_tipo: n.referencia_tipo,
        })),
        ...(avisosData || []).map(aviso => ({
          id: `aviso-${aviso.id}`,
          titulo: aviso.titulo,
          conteudo: aviso.conteudo,
          tipo: 'sistema' as const,
          lida: false,
          criada_em: aviso.criado_em,
          usuario_id: user.id,
          referencia_id: aviso.id,
          referencia_tipo: 'aviso_sistema',
        })),
      ];

      return notificacoes.sort((a, b) => 
        new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime()
      );
    },
    enabled: !!user?.id,
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: async (notificacaoId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      if (notificacaoId.startsWith('aviso-')) {
        // Para avisos do sistema, não fazemos nada (são sempre "não lidos")
        return;
      }

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId)
        .eq('usuario_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
    },
    onError: () => {
      toast({
        title: 'Erro ao marcar notificação como lida',
        variant: 'destructive',
      });
    },
  });

  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', user.id)
        .eq('lida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes', user?.id] });
      toast({
        title: 'Todas as notificações foram marcadas como lidas',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao marcar notificações como lidas',
        variant: 'destructive',
      });
    },
  });

  const criarNotificacaoMutation = useMutation({
    mutationFn: async (dados: {
      titulo: string;
      conteudo?: string;
      tipo: string;
      usuario_id: string;
      referencia_id?: string;
      referencia_tipo?: string;
    }) => {
      const { error } = await supabase
        .from('notificacoes')
        .insert(dados);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const notificacoes = notificacoesQuery.data || [];
  const naoLidas = notificacoes.filter(n => !n.lida);

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    loading: notificacoesQuery.isLoading,
    marcarComoLida: marcarComoLidaMutation.mutate,
    marcarTodasComoLidas: marcarTodasComoLidasMutation.mutate,
    criarNotificacao: criarNotificacaoMutation.mutate,
    refetch: notificacoesQuery.refetch,
  };
};
