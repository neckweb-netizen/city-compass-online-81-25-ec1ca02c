import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AtribuicaoAdmin = {
  id: string;
  usuario_id: string;
  empresa_id: string;
  criado_em: string;
  ativo: boolean;
  tipo_atribuicao: 'automatica' | 'manual';
  usuarios: {
    id: string;
    nome: string;
    email: string;
  } | null;
  empresas: {
    id: string;
    nome: string;
    categorias: { nome: string };
    cidades: { nome: string };
  } | null;
};

export const useEmpresaAdmins = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as empresas disponíveis para atribuição
  const empresasQuery = useQuery({
    queryKey: ['empresas-for-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          id,
          nome,
          categoria_id,
          cidade_id,
          categorias(nome),
          cidades(nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  // Buscar usuários disponíveis para serem administradores
  const usuariosDisponiveis = useQuery({
    queryKey: ['usuarios-disponveis-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, tipo_conta')
        .in('tipo_conta', ['usuario', 'criador_empresa', 'empresa'])
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  // Buscar atribuições existentes (manuais e automáticas)
  const atribuicoesQuery = useQuery({
    queryKey: ['empresa-admin-assignments'],
    queryFn: async () => {
      // Buscar atribuições manuais
      const { data: atribuicoesManuais, error: atribuicoesError } = await supabase
        .from('usuario_empresa_admin')
        .select('id, usuario_id, empresa_id, criado_em, ativo')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (atribuicoesError) throw atribuicoesError;

      // Buscar empresas aprovadas com proprietários
      const { data: empresasComProprietarios, error: empresasError } = await supabase
        .from('empresas')
        .select(`
          id,
          nome,
          usuario_id,
          criado_em,
          categorias!inner(nome),
          cidades!inner(nome)
        `)
        .eq('status_aprovacao', 'aprovado')
        .eq('ativo', true)
        .not('usuario_id', 'is', null);

      if (empresasError) throw empresasError;

      // Buscar dados dos usuários proprietários
      const proprietarioIds = empresasComProprietarios?.map(e => e.usuario_id).filter(Boolean) || [];
      let usuariosProprietarios: any[] = [];
      
      if (proprietarioIds.length > 0) {
        const { data: usuarios, error: usuariosError } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .in('id', proprietarioIds);

        if (usuariosError) throw usuariosError;
        usuariosProprietarios = usuarios || [];
      }

      // Criar atribuições automáticas para proprietários
      const atribuicoesAutomaticas = empresasComProprietarios?.map(empresa => ({
        id: `auto-${empresa.id}`, // ID único para atribuições automáticas
        usuario_id: empresa.usuario_id!,
        empresa_id: empresa.id,
        criado_em: empresa.criado_em,
        ativo: true,
        tipo_atribuicao: 'automatica' as const,
        usuarios: usuariosProprietarios.find(u => u.id === empresa.usuario_id) || null,
        empresas: {
          id: empresa.id,
          nome: empresa.nome,
          categorias: empresa.categorias,
          cidades: empresa.cidades
        }
      })) || [];

      let todasAtribuicoes: AtribuicaoAdmin[] = [...atribuicoesAutomaticas];

      // Processar atribuições manuais apenas se existirem
      if (atribuicoesManuais && atribuicoesManuais.length > 0) {
        // Buscar dados dos usuários para atribuições manuais
        const usuarioIds = atribuicoesManuais.map(a => a.usuario_id);
        const { data: usuarios, error: usuariosError } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .in('id', usuarioIds);

        if (usuariosError) throw usuariosError;

        // Buscar dados das empresas para atribuições manuais
        const empresaIds = atribuicoesManuais.map(a => a.empresa_id);
        const { data: empresas, error: empresasErrorManual } = await supabase
          .from('empresas')
          .select('id, nome, categorias(nome), cidades(nome)')
          .in('id', empresaIds);

        if (empresasErrorManual) throw empresasErrorManual;

        // Combinar os dados das atribuições manuais
        const atribuicoesManuaisCompletas: AtribuicaoAdmin[] = atribuicoesManuais.map(atribuicao => ({
          ...atribuicao,
          tipo_atribuicao: 'manual' as const,
          usuarios: usuarios?.find(u => u.id === atribuicao.usuario_id) || null,
          empresas: empresas?.find(e => e.id === atribuicao.empresa_id) || null,
        }));

        todasAtribuicoes = [...todasAtribuicoes, ...atribuicoesManuaisCompletas];
      }

      // Remover duplicatas (caso um usuário seja tanto proprietário quanto admin manual)
      const atribuicoesUnicas = todasAtribuicoes.filter((atribuicao, index, self) => 
        index === self.findIndex(a => 
          a.usuario_id === atribuicao.usuario_id && a.empresa_id === atribuicao.empresa_id
        )
      );

      return atribuicoesUnicas.sort((a, b) => 
        new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );
    },
  });

  // Atribuir usuário como admin de empresa
  const atribuirAdminMutation = useMutation({
    mutationFn: async ({ usuarioId, empresaId }: { usuarioId: string; empresaId: string }) => {
      const { error } = await supabase
        .from('usuario_empresa_admin')
        .insert({
          usuario_id: usuarioId,
          empresa_id: empresaId,
          atribuido_por: (await supabase.auth.getUser()).data.user?.id!,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-admin-assignments'] });
      toast({ title: 'Administrador atribuído com sucesso!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message?.includes('duplicate')
        ? 'Este usuário já é administrador desta empresa'
        : 'Erro ao atribuir administrador';
      toast({ 
        title: 'Erro', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  // Remover atribuição
  const removerAtribuicaoMutation = useMutation({
    mutationFn: async (atribuicaoId: string) => {
      const { error } = await supabase
        .from('usuario_empresa_admin')
        .update({ ativo: false })
        .eq('id', atribuicaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-admin-assignments'] });
      toast({ title: 'Atribuição removida com sucesso!' });
    },
    onError: () => {
      toast({ 
        title: 'Erro ao remover atribuição', 
        variant: 'destructive' 
      });
    },
  });

  return {
    empresas: empresasQuery.data || [],
    usuariosDisponiveis: usuariosDisponiveis.data || [],
    atribuicoes: atribuicoesQuery.data || [],
    loading: empresasQuery.isLoading || usuariosDisponiveis.isLoading || atribuicoesQuery.isLoading,
    atribuirAdmin: atribuirAdminMutation.mutate,
    removerAtribuicao: removerAtribuicaoMutation.mutate,
    refetch: () => {
      empresasQuery.refetch();
      usuariosDisponiveis.refetch();
      atribuicoesQuery.refetch();
    },
  };
};