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

export const useEnquetes = () => {
  const queryClient = useQueryClient();

  // Buscar enquete ativa para exibir na home
  const { data: enqueteAtiva, isLoading } = useQuery({
    queryKey: ['enquete-ativa'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('buscar_enquete_ativa');
      if (error) throw error;
      return data?.[0] as EnqueteAtiva | null;
    }
  });

  // Buscar todas as enquetes (admin)
  const { data: enquetes, isLoading: isLoadingAll } = useQuery({
    queryKey: ['enquetes'],
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
        ip_param: await getClientIP(),
        user_agent_param: navigator.userAgent
      });
      
      if (error) throw error;
      if (!data) throw new Error('Não foi possível votar. Você já pode ter votado nesta enquete.');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
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
      queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
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
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
      toast.success('Enquete atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar enquete: ' + error.message);
    }
  });

  // Excluir enquete (admin)
  const excluirEnquete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enquetes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquetes'] });
      queryClient.invalidateQueries({ queryKey: ['enquete-ativa'] });
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
    votarEnquete,
    criarEnquete,
    atualizarEnquete,
    excluirEnquete
  };
};

// Função auxiliar para obter IP do cliente
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}