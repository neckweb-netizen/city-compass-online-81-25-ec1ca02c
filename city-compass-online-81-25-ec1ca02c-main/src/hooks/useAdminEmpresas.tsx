
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
      
      const { error } = await supabase
        .from('empresas')
        .update({ 
          status_aprovacao: 'aprovado',
          aprovado_por: user?.id,
          observacoes_admin: observacoes,
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa aprovada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao aprovar empresa', variant: 'destructive' });
    },
  });

  const rejeitarEmpresaMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('empresas')
        .update({ 
          status_aprovacao: 'rejeitado',
          aprovado_por: user?.id,
          observacoes_admin: observacoes
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa rejeitada' });
    },
    onError: () => {
      toast({ title: 'Erro ao rejeitar empresa', variant: 'destructive' });
    },
  });

  const toggleEmpresaMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('empresas')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      toast({ title: 'Empresa atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar empresa', variant: 'destructive' });
    },
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-empresas-pendentes'] });
      toast({ title: 'Empresa removida com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover empresa', variant: 'destructive' });
    },
  });

  return {
    empresas: empresasQuery.data || [],
    empresasPendentes: empresasPendentesQuery.data || [],
    loading: empresasQuery.isLoading,
    loadingPendentes: empresasPendentesQuery.isLoading,
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
