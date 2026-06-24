
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useMinhaEmpresa = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: empresas, isLoading, error } = useQuery({
    queryKey: ['minhas-empresas', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('useMinhaEmpresa: Usuário não encontrado');
        return [];
      }

      console.log('useMinhaEmpresa: Buscando empresas para usuário:', user.id);

      // Busca empresas do usuário diretamente
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar empresas do usuário:', error);
        return [];
      }

      console.log('useMinhaEmpresa: Empresas encontradas:', data);
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Seleciona a primeira empresa (pode ser expandido para permitir seleção)
  const empresa = empresas && empresas.length > 0 ? empresas[0] : null;

  // Função para verificar se o usuário pode editar uma empresa específica
  const podeEditar = (empresaId: string) => {
    if (!user || !empresa) return false;
    
    // Verifica se é proprietário direto
    if (empresa.usuario_id === user.id) return true;
    
    // Verifica se é admin atribuído (se a empresa retornada for a mesma que está tentando editar)
    if (empresa.id === empresaId) return true;
    
    return false;
  };

  const updateEmpresaMutation = useMutation({
    mutationFn: async (dados: any) => {
      if (!user || !empresa) throw new Error('Usuário ou empresa não encontrados');

      // Se está atualizando horário de funcionamento, usar RPC
      if (dados.horario_funcionamento) {
        const { error } = await supabase.rpc('atualizar_horario_funcionamento', {
          empresa_id_param: empresa.id,
          horarios_param: dados.horario_funcionamento
        });
        if (error) throw error;
      } else {
        // Para outros campos, usar update normal
        const { error } = await supabase
          .from('empresas')
          .update(dados)
          .eq('id', empresa.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalida todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({ title: 'Empresa atualizada com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar empresa:', error);
      toast({ 
        title: 'Erro ao atualizar empresa', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  return {
    empresa,
    empresas: empresas || [],
    isLoading,
    error,
    updateEmpresa: updateEmpresaMutation.mutate,
    isUpdating: updateEmpresaMutation.isPending,
    podeEditar, // Expõe a função para verificar se pode editar
  };
};
