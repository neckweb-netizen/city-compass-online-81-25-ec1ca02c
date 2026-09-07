
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
    if (!user) return false;

    return Boolean(
      empresas?.some(
        (empresaDoUsuario) =>
          empresaDoUsuario.id === empresaId && empresaDoUsuario.usuario_id === user.id,
      ),
    );
  };

  const updateEmpresaMutation = useMutation({
    mutationFn: async ({ empresaId, dados }: { empresaId: string; dados: any }) => {
      if (!user) throw new Error('Usuário não encontrado');

      const usuarioEhProprietario = empresas?.some(
        (empresaDoUsuario) =>
          empresaDoUsuario.id === empresaId && empresaDoUsuario.usuario_id === user.id,
      );

      if (!usuarioEhProprietario) {
        throw new Error('Você não tem permissão para editar esta empresa');
      }

      const { data: empresaAtualizada, error } = await supabase
        .from('empresas')
        .update(dados)
        .eq('id', empresaId)
        .eq('usuario_id', user.id)
        .select('id, horario_funcionamento, atualizado_em')
        .maybeSingle();
      if (error) throw error;
      if (!empresaAtualizada) {
        throw new Error('Empresa não encontrada ou sem permissão para editar');
      }
      return empresaAtualizada;
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

  const updateEmpresa = (dados: any, empresaId = empresa?.id) => {
    if (!empresaId) {
      toast({
        title: 'Empresa não encontrada',
        description: 'Não foi possível identificar a empresa que será atualizada.',
        variant: 'destructive',
      });
      return;
    }

    updateEmpresaMutation.mutate({ empresaId, dados });
  };

  return {
    empresa,
    empresas: empresas || [],
    isLoading,
    error,
    updateEmpresa,
    isUpdating: updateEmpresaMutation.isPending,
    podeEditar, // Expõe a função para verificar se pode editar
  };
};
