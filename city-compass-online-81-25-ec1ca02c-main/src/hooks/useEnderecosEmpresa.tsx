import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useEnderecosEmpresa = (empresaId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enderecos, isLoading } = useQuery({
    queryKey: ['enderecos-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];

      // Buscar endereços da nova tabela
      const { data: enderecosEmpresa, error: errorEnderecos } = await supabase
        .from('enderecos_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true);

      if (errorEnderecos) throw errorEnderecos;

      // Buscar dados da empresa (endereço legado)
      const { data: empresa, error: errorEmpresa } = await supabase
        .from('empresas')
        .select('endereco, telefone')
        .eq('id', empresaId)
        .single();

      if (errorEmpresa) throw errorEmpresa;

      const todosEnderecos = [...(enderecosEmpresa || [])];

      // Se a empresa tem endereço legado e não existe nenhum endereço principal, adicionar como principal
      if (empresa?.endereco && !enderecosEmpresa?.find(end => end.principal)) {
        const enderecoLegado = {
          id: 'legado-' + empresaId,
          empresa_id: empresaId,
          nome_identificacao: 'Endereço Principal',
          endereco: empresa.endereco,
          telefone: empresa.telefone || null,
          principal: true,
          ativo: true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
          localizacao: null,
          cidade_id: null,
          bairro: null,
          cep: null,
          horario_funcionamento: null
        };
        todosEnderecos.unshift(enderecoLegado);
      }

      // Ordenar: principal primeiro, depois por data de criação
      return todosEnderecos.sort((a, b) => {
        if (a.principal && !b.principal) return -1;
        if (!a.principal && b.principal) return 1;
        return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
      });
    },
    enabled: !!empresaId,
  });

  const createEnderecoMutation = useMutation({
    mutationFn: async (novoEndereco: any) => {
      const { error } = await supabase
        .from('enderecos_empresa')
        .insert(novoEndereco);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-empresa'] });
      toast({ title: 'Endereço adicionado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao criar endereço:', error);
      toast({ 
        title: 'Erro ao adicionar endereço', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  const updateEnderecoMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: any }) => {
      const { error } = await supabase
        .from('enderecos_empresa')
        .update(dados)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-empresa'] });
      toast({ title: 'Endereço atualizado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar endereço:', error);
      toast({ 
        title: 'Erro ao atualizar endereço', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  const deleteEnderecoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enderecos_empresa')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-empresa'] });
      toast({ title: 'Endereço removido com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao remover endereço:', error);
      toast({ 
        title: 'Erro ao remover endereço', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  const definirPrincipalMutation = useMutation({
    mutationFn: async (enderecoId: string) => {
      // Primeiro, remove principal de todos os endereços da empresa
      await supabase
        .from('enderecos_empresa')
        .update({ principal: false })
        .eq('empresa_id', empresaId);

      // Depois define o novo principal
      const { error } = await supabase
        .from('enderecos_empresa')
        .update({ principal: true })
        .eq('id', enderecoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enderecos-empresa'] });
      toast({ title: 'Endereço principal definido!' });
    },
    onError: (error) => {
      console.error('Erro ao definir endereço principal:', error);
      toast({ 
        title: 'Erro ao definir endereço principal', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    },
  });

  return {
    enderecos: enderecos || [],
    isLoading,
    createEndereco: createEnderecoMutation.mutate,
    updateEndereco: updateEnderecoMutation.mutate,
    deleteEndereco: deleteEnderecoMutation.mutate,
    definirPrincipal: definirPrincipalMutation.mutate,
    isCreating: createEnderecoMutation.isPending,
    isUpdating: updateEnderecoMutation.isPending,
    isDeleting: deleteEnderecoMutation.isPending,
  };
};