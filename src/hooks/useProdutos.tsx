
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Produto {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  preco_original: number;
  preco_promocional?: number;
  categoria_produto?: string;
  imagem_principal_url?: string;
  galeria_imagens?: string[];
  ativo: boolean;
  destaque: boolean;
  estoque_disponivel?: number;
  codigo_produto?: string;
  tags?: string[];
  link_compra?: string;
  link_whatsapp?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ProdutoInput {
  nome: string;
  descricao?: string;
  preco_original: number;
  preco_promocional?: number;
  categoria_produto?: string;
  imagem_principal_url?: string;
  galeria_imagens?: string[];
  ativo?: boolean;
  destaque?: boolean;
  estoque_disponivel?: number;
  codigo_produto?: string;
  tags?: string[];
  link_compra?: string;
  link_whatsapp?: string;
}

export const useProdutos = (empresaId?: string) => {
  return useQuery({
    queryKey: ['produtos', empresaId],
    staleTime: 60_000,
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select(`
          *,
          empresas!inner(
            id,
            nome,
            verificado,
            ativo,
            status_aprovacao
          )
        `)
        .eq('ativo', true)
        .eq('empresas.ativo', true)
        .eq('empresas.status_aprovacao', 'aprovado')
        .order('destaque', { ascending: false })
        .order('criado_em', { ascending: false });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }

      return data as any[];
    },
  });
};

export const useProdutosPorEmpresa = (empresaId: string) => {
  return useQuery({
    queryKey: ['produtos', 'empresa', empresaId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('destaque', { ascending: false })
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos da empresa:', error);
        throw error;
      }

      return data as Produto[];
    },
    enabled: !!empresaId,
  });
};

export const useCriarProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produto: ProdutoInput & { empresa_id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert([produto])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar produto:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto');
    },
  });
};

export const useAtualizarProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empresa_id, ...produto }: Partial<ProdutoInput> & { id: string; empresa_id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id)
        .eq('empresa_id', empresa_id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }

      if (!data) throw new Error('Produto não encontrado ou sem permissão para editar.');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar produto');
    },
  });
};

export const useExcluirProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empresaId }: { id: string; empresaId: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({ ativo: false })
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Produto não encontrado ou sem permissão para desativar.');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir produto');
    },
  });
};
