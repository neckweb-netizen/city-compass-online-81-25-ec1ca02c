
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminEmpresas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const empresasQuery = useQuery({
    queryKey: ['admin-empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          categorias(nome),
          usuario:usuarios!empresas_usuario_id_fkey(nome, email),
          cidades(nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const empresasPendentesQuery = useQuery({
    queryKey: ['admin-empresas-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          categorias(nome),
          usuario:usuarios!empresas_usuario_id_fkey(nome, email, telefone),
          cidades(nome)
        `)
        .eq('status_aprovacao', 'pendente')
        .order('criado_em', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const aprovarEmpresaMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Sessão expirada');
      const { data: updated, error } = await supabase
        .from('empresas')
        .update({
          status_aprovacao: 'aprovado',
          aprovado_por: user.id,
          observacoes_admin: observacoes,
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status_aprovacao', 'pendente')
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Empresa não encontrada, já analisada ou sem permissão.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa aprovada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao aprovar empresa', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    },
  });

  const rejeitarEmpresaMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Sessão expirada');
      if (!observacoes.trim()) throw new Error('Informe o motivo da rejeição');
      const { data: updated, error } = await supabase
        .from('empresas')
        .update({
          status_aprovacao: 'rejeitado',
          aprovado_por: user.id,
          observacoes_admin: observacoes.trim()
        })
        .eq('id', id)
        .eq('status_aprovacao', 'pendente')
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Empresa não encontrada, já analisada ou sem permissão.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa rejeitada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao rejeitar empresa', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    },
  });

  const toggleEmpresaMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      if (!['ativo', 'verificado', 'destaque'].includes(field)) throw new Error('Campo não permitido');
      const { data: updated, error } = await supabase
        .from('empresas')
        .update({ [field]: value })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Empresa não encontrada ou sem permissão.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      toast({ title: 'Empresa atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar empresa', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    },
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: removed, error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!removed) throw new Error('Empresa não encontrada ou sem permissão para excluir.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa removida com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover empresa', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    },
  });

  return {
    empresas: empresasQuery.data || [],
    empresasPendentes: empresasPendentesQuery.data || [],
    loading: empresasQuery.isLoading,
    loadingPendentes: empresasPendentesQuery.isLoading,
    error: empresasQuery.error,
    errorPendentes: empresasPendentesQuery.error,
    refetchPendentes: empresasPendentesQuery.refetch,
    isProcessing: aprovarEmpresaMutation.isPending || rejeitarEmpresaMutation.isPending || toggleEmpresaMutation.isPending || deleteEmpresaMutation.isPending,
    aprovarEmpresa: aprovarEmpresaMutation.mutate,
    rejeitarEmpresa: rejeitarEmpresaMutation.mutate,
    toggleEmpresa: toggleEmpresaMutation.mutate,
    deleteEmpresa: deleteEmpresaMutation.mutate,
    refetch: () => {
      empresasQuery.refetch();
      empresasPendentesQuery.refetch();
    },
  };
};
