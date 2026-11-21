
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
        .maybeSingle();

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
      if (!Number.isInteger(nota) || nota < 1 || nota > 5 || (comentario?.length || 0) > 4000) throw new Error('Nota ou comentário inválido.');
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
      void queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes', variables.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-estatisticas-avaliacoes', variables.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['usuario-ja-avaliou', variables.empresaId, variables.usuarioId] });
      void queryClient.invalidateQueries({ queryKey: ['user-avaliacoes', variables.usuarioId] });
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

      if (nota !== undefined && (!Number.isInteger(nota) || nota < 1 || nota > 5)) throw new Error('Nota inválida.');
      if (comentario !== undefined && comentario.length > 4000) throw new Error('Comentário muito longo.');
      const { data, error } = await supabase
        .from('avaliacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Avaliação não encontrada ou sem permissão para editar.');
      return data;
    },
    onSuccess: () => {
      toast.success('Avaliação atualizada com sucesso!');
      void queryClient.invalidateQueries({ queryKey: ['admin-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-denuncias-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-estatisticas-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['user-avaliacoes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao editar avaliação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao editar avaliação. Tente novamente.');
    },
  });
};

export const useRemoverAvaliacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Avaliação não encontrada ou sem permissão para remover.');
    },
    onSuccess: () => {
      toast.success('Avaliação removida com sucesso!');
      void queryClient.invalidateQueries({ queryKey: ['admin-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['empresa-estatisticas-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['user-avaliacoes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao remover avaliação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover avaliação. Tente novamente.');
    },
  });
};

/** Company owners can edit only their public response, never the review rating or authorship. */
export const useResponderAvaliacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, empresaId, resposta }: { id: string; empresaId: string; resposta: string }) => {
      const message = resposta.trim();
      if (!message || message.length > 2000) throw new Error('Resposta deve conter entre 1 e 2000 caracteres.');
      const { data, error } = await supabase
        .from('avaliacoes')
        .update({ resposta_empresa: message, respondido_em: new Date().toISOString() })
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Avaliação não encontrada ou sem permissão para responder.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes'] });
      void queryClient.invalidateQueries({ queryKey: ['user-avaliacoes'] });
      toast.success('Resposta publicada com sucesso.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Não foi possível responder.'),
  });
};
