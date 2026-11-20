import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Enquete {
  id: string;
  titulo: string;
  descricao?: string;
  opcoes: string[];
  multipla_escolha: boolean;
  ativo: boolean;
  data_inicio: string;
  data_fim?: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

interface EnqueteAtiva {
  id: string;
  titulo: string;
  descricao?: string;
  opcoes: string[];
  multipla_escolha: boolean;
  total_votos: number;
  resultados: Array<{
    opcao_indice: number;
    count: number;
  }>;
}

export const useEnquetes = (includeAdminList = false) => {
  const queryClient = useQueryClient();

  // Buscar enquete ativa para exibir na home
  const { data: enqueteAtiva, isLoading, isError: isActiveError, refetch: refetchActive } = useQuery({
    queryKey: ['enquete-ativa'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('buscar_enquete_ativa');
      if (error) throw error;
      return (data?.[0] ?? null) as EnqueteAtiva | null;
    }
  });

  // Buscar todas as enquetes (admin)
  const { data: enquetes, isLoading: isLoadingAll, isError: isAdminError, refetch: refetchAdmin } = useQuery({
    queryKey: ['enquetes'],
    enabled: includeAdminList,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enquetes')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data as Enquete[];
    }
  });

  // Votar na enquete
  const votarEnquete = useMutation({
    mutationFn: async ({ 
      enqueteId, 
      opcoes 
    }: { 
      enqueteId: string; 
      opcoes: number[]; 
    }) => {
      const { data, error } = await supabase.rpc('votar_enquete', {
        enquete_id_param: enqueteId,
        opcoes_indices: opcoes,
        ip_param: null,
        user_agent_param: null
      });
      
      if (error) throw error;
      if (!data) throw new Error('Não foi possível votar. Você já pode ter votado nesta enquete.');
      
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
      toast.success('Voto registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao votar na enquete');
    }
  });

  // Criar enquete (admin)
  const criarEnquete = useMutation({
    mutationFn: async (enquete: Omit<Enquete, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>) => {
      const { data, error } = await supabase
        .from('enquetes')
        .insert({
          ...enquete,
          criado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      void queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
      toast.success('Enquete criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar enquete: ' + error.message);
    }
  });

  // Atualizar enquete (admin)
  const atualizarEnquete = useMutation({
    mutationFn: async ({ id, ...enquete }: Partial<Enquete> & { id: string }) => {
      const { data, error } = await supabase
        .from('enquetes')
        .update(enquete)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Enquete não encontrada ou sem permissão para editar.');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      void queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
      toast.success('Enquete atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar enquete: ' + error.message);
    }
  });

  // Excluir enquete (admin)
  const excluirEnquete = useMutation({
    mutationFn: async (id: string) => {
      const { data: removed, error } = await supabase
        .from('enquetes')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!removed) throw new Error('Enquete não encontrada ou sem permissão para excluir.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      void queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
      toast.success('Enquete excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir enquete: ' + error.message);
    }
  });

  return {
    enqueteAtiva,
    enquetes,
    isLoading,
    isLoadingAll,
    isActiveError,
    isAdminError,
    refetchActive,
    refetchAdmin,
    isProcessing: criarEnquete.isPending || atualizarEnquete.isPending || excluirEnquete.isPending,
    votarEnquete,
    criarEnquete,
    atualizarEnquete,
    excluirEnquete
  };
};
