
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEmpresaAvaliacoes = (empresaId: string) => {
  return useQuery({
    queryKey: ['empresa-avaliacoes', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          usuarios(
            nome
          )
        `)
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
};

export const useEmpresaEstatisticasAvaliacoes = (empresaId: string) => {
  return useQuery({
    queryKey: ['empresa-estatisticas-avaliacoes', empresaId],
    queryFn: async () => {
      // Buscar todas as avaliações para calcular estatísticas
      const { data: avaliacoes, error } = await supabase
        .from('avaliacoes')
        .select('nota')
        .eq('empresa_id', empresaId);

      if (error) throw error;

      if (!avaliacoes || avaliacoes.length === 0) {
        return {
          total_avaliacoes: 0,
          media_avaliacoes: 0,
          distribuicao_notas: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const total = avaliacoes.length;
      const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
      const media = soma / total;

      // Calcular distribuição por nota
      const distribuicao = avaliacoes.reduce((acc, av) => {
        acc[av.nota] = (acc[av.nota] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Garantir que todas as notas de 1-5 existam
      const distribuicaoCompleta = {
        1: distribuicao[1] || 0,
        2: distribuicao[2] || 0,
        3: distribuicao[3] || 0,
        4: distribuicao[4] || 0,
        5: distribuicao[5] || 0,
      };

      return {
        total_avaliacoes: total,
        media_avaliacoes: parseFloat(media.toFixed(1)),
        distribuicao_notas: distribuicaoCompleta
      };
    },
    enabled: !!empresaId,
  });
};

export const useUsuarioJaAvaliou = (empresaId: string, usuarioId?: string) => {
  return useQuery({
    queryKey: ['usuario-ja-avaliou', empresaId, usuarioId],
    queryFn: async () => {
      if (!usuarioId) return false;

      const { data, error } = await supabase
        .from('avaliacoes')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('usuario_id', usuarioId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!empresaId && !!usuarioId,
  });
};

export const useCriarAvaliacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, nota, comentario, usuarioId }: {
      empresaId: string;
      nota: number;
      comentario?: string;
      usuarioId: string;
    }) => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .insert({
          usuario_id: usuarioId,
          empresa_id: empresaId,
          nota,
          comentario: comentario?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Avaliação criada com sucesso!');
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes', variables.empresaId] });
      queryClient.invalidateQueries({ queryKey: ['empresa-estatisticas-avaliacoes', variables.empresaId] });
      queryClient.invalidateQueries({ queryKey: ['usuario-ja-avaliou', variables.empresaId, variables.usuarioId] });
      queryClient.invalidateQueries({ queryKey: ['user-avaliacoes', variables.usuarioId] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar avaliação:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('Você já avaliou esta empresa anteriormente');
      } else {
        toast.error('Erro ao criar avaliação. Tente novamente.');
      }
    },
  });
};

export const useUserAvaliacoes = (usuarioId?: string) => {
  return useQuery({
    queryKey: ['user-avaliacoes', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return [];

      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          empresas(
            id,
            nome,
            slug,
            imagem_capa_url,
            categorias(nome)
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!usuarioId,
  });
};

export const useAdminAvaliacoes = () => {
  return useQuery({
    queryKey: ['admin-avaliacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          empresas(nome),
          usuarios(nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useEditarAvaliacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comentario, nota }: {
      id: string;
      comentario?: string;
      nota?: number;
    }) => {
      const updateData: any = {};
      if (comentario !== undefined) updateData.comentario = comentario?.trim() || null;
      if (nota !== undefined) updateData.nota = nota;
      updateData.atualizado_em = new Date().toISOString();

      const { data, error } = await supabase
        .from('avaliacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Avaliação atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-avaliacoes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao editar avaliação:', error);
      toast.error('Erro ao editar avaliação. Tente novamente.');
    },
  });
};

export const useRemoverAvaliacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avaliacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-avaliacoes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao remover avaliação:', error);
      toast.error('Erro ao remover avaliação. Tente novamente.');
    },
  });
};
