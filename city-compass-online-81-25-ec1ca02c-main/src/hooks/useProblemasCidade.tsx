import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProblemaCidade {
  id: string;
  titulo: string;
  descricao: string;
  categoria_id: string | null;
  cidade_id: string;
  bairro: string | null;
  endereco: string;
  localizacao: unknown;
  usuario_id: string;
  status: 'aberto' | 'em_analise' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  imagens: string[];
  visualizacoes: number;
  votos_positivos: number;
  votos_negativos: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  categoria?: {
    nome: string;
    icone: string;
    cor: string;
  };
  usuario?: {
    nome: string;
  };
  total_comentarios?: number;
  meu_voto?: number;
}

export const useProblemasCidade = (cidadeId?: string, filters?: {
  categoriaId?: string;
  status?: string;
  ordenacao?: 'recentes' | 'populares' | 'resolvidos';
}) => {
  const queryClient = useQueryClient();

  const { data: problemas, isLoading } = useQuery({
    queryKey: ['problemas-cidade', cidadeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('problemas_cidade')
        .select(`
          *,
          categoria:categorias_problema(nome, icone, cor),
          usuario:usuarios(nome)
        `)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado');

      if (cidadeId) {
        query = query.eq('cidade_id', cidadeId);
      }

      if (filters?.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }

      // Ordenação
      if (filters?.ordenacao === 'populares') {
        query = query.order('votos_positivos', { ascending: false });
      } else if (filters?.ordenacao === 'resolvidos') {
        query = query.eq('status', 'resolvido').order('resolvido_em', { ascending: false });
      } else {
        query = query.order('criado_em', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any[];
    },
  });

  const criarProblema = useMutation({
    mutationFn: async (novoProblema: {
      titulo: string;
      descricao: string;
      categoria_id: string;
      cidade_id: string;
      bairro?: string;
      endereco: string;
      imagens?: string[];
      prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('problemas_cidade')
        .insert([{ ...novoProblema, usuario_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemas-cidade'] });
      toast.success('Reclamação enviada para aprovação!');
    },
    onError: () => {
      toast.error('Erro ao publicar reclamação');
    },
  });

  const votarProblema = useMutation({
    mutationFn: async ({ problemaId, tipoVoto }: { problemaId: string; tipoVoto: 1 | -1 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: votoExistente } = await supabase
        .from('votos_problema')
        .select('*')
        .eq('problema_id', problemaId)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (votoExistente) {
        if (votoExistente.tipo_voto === tipoVoto) {
          // Remove o voto
          await supabase
            .from('votos_problema')
            .delete()
            .eq('id', votoExistente.id);
        } else {
          // Atualiza o voto
          await supabase
            .from('votos_problema')
            .update({ tipo_voto: tipoVoto })
            .eq('id', votoExistente.id);
        }
      } else {
        // Cria novo voto
        await supabase
          .from('votos_problema')
          .insert([{ problema_id: problemaId, tipo_voto: tipoVoto, usuario_id: user.id }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemas-cidade'] });
      queryClient.invalidateQueries({ queryKey: ['problema-detalhes'] });
    },
  });

  const incrementarVisualizacao = useMutation({
    mutationFn: async (problemaId: string) => {
      await supabase.rpc('incrementar_visualizacao_problema', {
        problema_id_param: problemaId,
      });
    },
  });

  return {
    problemas,
    isLoading,
    criarProblema,
    votarProblema,
    incrementarVisualizacao,
  };
};

export const useProblemaDetalhes = (problemaId: string) => {
  const queryClient = useQueryClient();

  const { data: problema, isLoading } = useQuery({
    queryKey: ['problema-detalhes', problemaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('problemas_cidade')
        .select(`
          *,
          categoria:categorias_problema(nome, icone, cor),
          usuario:usuarios(nome)
        `)
        .eq('id', problemaId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!problemaId,
  });

  const { data: comentarios } = useQuery({
    queryKey: ['comentarios-problema', problemaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comentarios_problema')
        .select('*')
        .eq('problema_id', problemaId)
        .eq('ativo', true)
        .is('comentario_pai_id', null)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      // Buscar informações dos usuários manualmente
      const comentariosComUsuarios = await Promise.all(
        (data || []).map(async (comentario) => {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', comentario.usuario_id)
            .maybeSingle();

          return {
            ...comentario,
            usuario,
          };
        })
      );

      return comentariosComUsuarios;
    },
    enabled: !!problemaId,
  });

  const criarComentario = useMutation({
    mutationFn: async (novoComentario: {
      conteudo: string;
      imagens?: string[];
      comentario_pai_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('comentarios_problema')
        .insert([{
          problema_id: problemaId,
          usuario_id: user.id,
          ...novoComentario,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-problema', problemaId] });
      toast.success('Comentário publicado!');
    },
    onError: () => {
      toast.error('Erro ao publicar comentário');
    },
  });

  const votarComentario = useMutation({
    mutationFn: async ({ comentarioId, tipoVoto }: { comentarioId: string; tipoVoto: 1 | -1 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: votoExistente } = await supabase
        .from('votos_comentario')
        .select('*')
        .eq('comentario_id', comentarioId)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (votoExistente) {
        if (votoExistente.tipo_voto === tipoVoto) {
          await supabase
            .from('votos_comentario')
            .delete()
            .eq('id', votoExistente.id);
        } else {
          await supabase
            .from('votos_comentario')
            .update({ tipo_voto: tipoVoto })
            .eq('id', votoExistente.id);
        }
      } else {
        await supabase
          .from('votos_comentario')
          .insert([{ comentario_id: comentarioId, tipo_voto: tipoVoto, usuario_id: user.id }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-problema', problemaId] });
    },
  });

  return {
    problema,
    comentarios,
    isLoading,
    criarComentario,
    votarComentario,
  };
};

export const useCategoriasProblema = () => {
  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias-problema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_problema')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      return data;
    },
  });

  return { categorias, isLoading };
};
