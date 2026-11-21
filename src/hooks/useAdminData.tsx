
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Define the tipo_conta enum to match the database
type TipoConta = 'usuario' | 'empresa' | 'criador_empresa' | 'admin_cidade' | 'admin_geral';

// Hook para buscar estatísticas gerais
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, ativo, verificado, destaque, status_aprovacao')
        .eq('ativo', true);

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, tipo_conta');

      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id, ativo')
        .eq('ativo', true);

      const { data: avaliacoes, error: avaliacoesError } = await supabase
        .from('avaliacoes')
        .select('id, nota');

      const { data: cupons, error: cuponsError } = await supabase
        .from('cupons')
        .select('id, ativo')
        .eq('ativo', true);

      const { data: empresasPendentes, error: pendentesError } = await supabase
        .from('empresas')
        .select('id')
        .eq('status_aprovacao', 'pendente');

      const queryError = [empresasError, usuariosError, eventosError, avaliacoesError, cuponsError, pendentesError].find(Boolean);
      if (queryError) throw queryError;

      return {
        totalEmpresas: empresas?.length || 0,
        empresasVerificadas: empresas?.filter(e => e.verificado).length || 0,
        empresasDestaque: empresas?.filter(e => e.destaque).length || 0,
        empresasPendentes: empresasPendentes?.length || 0,
        totalUsuarios: usuarios?.length || 0,
        usuariosEmpresa: usuarios?.filter(u => u.tipo_conta === 'empresa').length || 0,
        totalEventos: eventos?.length || 0,
        totalAvaliacoes: avaliacoes?.length || 0,
        mediaAvaliacoes: avaliacoes?.length ? 
          (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1) : '0',
        totalCupons: cupons?.length || 0,
      };
    },
  });
};

// Hook para gerenciar usuários com segurança
export const useAdminUsuarios = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ['admin-usuarios', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          cidades(nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get current user profile to check permissions
  const currentUserQuery = useQuery({
    queryKey: ['current-user-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('tipo_conta, cidade_id')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateUsuarioMutation = useMutation({
    mutationFn: async ({ id, tipo_conta }: { id: string; tipo_conta: TipoConta }) => {
      // Client-side validation (server will also validate)
      const currentUser = currentUserQuery.data;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Check if user can assign this role
      if (currentUser.tipo_conta === 'admin_cidade' && tipo_conta === 'admin_geral') {
        throw new Error('Admin de cidade não pode criar Admin Geral');
      }

      if (currentUser.tipo_conta !== 'admin_geral' && currentUser.tipo_conta !== 'admin_cidade') {
        throw new Error('Acesso negado: permissões insuficientes');
      }

      const { data: updated, error } = await supabase
        .from('usuarios')
        .update({ tipo_conta })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Usuário não encontrado ou sem permissão para alterar o perfil.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      toast({ title: 'Usuário atualizado com sucesso!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao atualizar usuário';
      toast({ 
        title: 'Erro de Segurança', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Client-side validation
      const currentUser = currentUserQuery.data;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Only admin_geral and admin_cidade can delete users
      if (currentUser.tipo_conta !== 'admin_geral' && currentUser.tipo_conta !== 'admin_cidade') {
        throw new Error('Acesso negado: permissões insuficientes');
      }

      // Check if trying to delete another admin
      const userToDelete = usuariosQuery.data?.find(u => u.id === userId);
      if (userToDelete?.tipo_conta === 'admin_geral' && currentUser.tipo_conta !== 'admin_geral') {
        throw new Error('Apenas Admin Geral pode excluir outros Admin Geral');
      }

      const { data: removed, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!removed) throw new Error('Usuário não encontrado ou sem permissão para excluir o perfil.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      toast({ title: 'Usuário excluído com sucesso!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao excluir usuário';
      toast({ 
        title: 'Erro de Segurança', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  // Function to check what roles current user can assign
  const getAvailableRoles = (): TipoConta[] => {
    const currentUser = currentUserQuery.data;
    if (!currentUser) return [];

    if (currentUser.tipo_conta === 'admin_geral') {
      return ['usuario', 'criador_empresa', 'empresa', 'admin_cidade', 'admin_geral'];
    } else if (currentUser.tipo_conta === 'admin_cidade') {
      return ['usuario', 'criador_empresa', 'empresa'];
    }
    
    return [];
  };

  return {
    usuarios: usuariosQuery.data || [],
    loading: usuariosQuery.isLoading || currentUserQuery.isLoading,
    updateUsuario: updateUsuarioMutation.mutateAsync,
    deleteUsuario: deleteUsuarioMutation.mutateAsync,
    isProcessing: updateUsuarioMutation.isPending || deleteUsuarioMutation.isPending,
    error: usuariosQuery.error || currentUserQuery.error,
    refetchCurrentUser: currentUserQuery.refetch,
    refetch: usuariosQuery.refetch,
    currentUserRole: currentUserQuery.data?.tipo_conta,
    getAvailableRoles,
  };
};

// Hook para gerenciar categorias
export const useAdminCategorias = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriasQuery = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const toggleCategoriaMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data: updated, error } = await supabase
        .from('categorias')
        .update({ ativo })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Categoria não encontrada ou sem permissão para alterar.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      toast({ title: 'Categoria atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar categoria', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    },
  });

  return {
    categorias: categoriasQuery.data || [],
    loading: categoriasQuery.isLoading,
    toggleCategoria: toggleCategoriaMutation.mutate,
    refetch: categoriasQuery.refetch,
  };
};
