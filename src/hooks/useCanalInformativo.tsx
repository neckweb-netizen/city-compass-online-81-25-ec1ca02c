import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PremioSorteio {
  premio: string;
  milhar: string;
  grupo: string;
}

export interface ResultadoSorteioData {
  data_sorteio: string;
  premios: PremioSorteio[];
}

export interface CanalInformativoItem {
  id: string;
  titulo: string;
  conteudo?: string;
  tipo_conteudo: 'noticia' | 'video' | 'imagem' | 'resultado_sorteio';
  url_midia?: string;
  link_externo?: string;
  autor_id: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  resultado_sorteio?: ResultadoSorteioData & {
    id: string;
  };
}

export interface CreateCanalInformativoData {
  titulo: string;
  conteudo?: string;
  tipo_conteudo: 'noticia' | 'video' | 'imagem' | 'resultado_sorteio';
  url_midia?: string;
  link_externo?: string;
  resultado_sorteio?: ResultadoSorteioData;
}

export interface UpdateCanalInformativoData extends CreateCanalInformativoData {
  id: string;
}

const limparValorOpcional = (valor?: string) => {
  const valorLimpo = valor?.trim();
  return valorLimpo ? valorLimpo : null;
};

export const useCanalInformativo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canalQuery = useQuery({
    queryKey: ['canal-informativo'],
    queryFn: async () => {
      const { data: canalData, error: canalError } = await supabase
        .from('canal_informativo')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (canalError) throw canalError;

      const canalItems = await Promise.all(
        (canalData ?? []).map(async (item) => {
          if (item.tipo_conteudo !== 'resultado_sorteio') {
            return item;
          }

          const { data: rpcData, error: rpcError } = await supabase
            .rpc('buscar_resultado_sorteio', { canal_id: item.id });

          if (rpcError) {
            console.error('Erro ao buscar resultado de sorteio:', rpcError);
            return { ...item, resultado_sorteio: undefined };
          }

          const resultado = Array.isArray(rpcData) ? rpcData[0] : rpcData;

          return {
            ...item,
            resultado_sorteio: resultado
              ? {
                  id: resultado.id,
                  data_sorteio: resultado.data_sorteio,
                  premios: Array.isArray(resultado.premios)
                    ? (resultado.premios as unknown as PremioSorteio[])
                    : [],
                }
              : undefined,
          };
        })
      );

      return canalItems as CanalInformativoItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCanalInformativoData) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('Usuário não autenticado');

      const { data: canalItem, error: canalError } = await supabase
        .from('canal_informativo')
        .insert([
          {
            titulo: data.titulo.trim(),
            conteudo: limparValorOpcional(data.conteudo),
            tipo_conteudo: data.tipo_conteudo,
            url_midia: limparValorOpcional(data.url_midia),
            link_externo: limparValorOpcional(data.link_externo),
            autor_id: authData.user.id,
          },
        ])
        .select()
        .single();

      if (canalError) throw canalError;

      if (data.tipo_conteudo === 'resultado_sorteio') {
        if (!data.resultado_sorteio?.data_sorteio) {
          await supabase.from('canal_informativo').delete().eq('id', canalItem.id);
          throw new Error('A data do sorteio é obrigatória.');
        }

        const premiosValidos = data.resultado_sorteio.premios.filter(
          (premio) => premio.milhar.trim() || premio.grupo.trim()
        );

        if (premiosValidos.length === 0) {
          await supabase.from('canal_informativo').delete().eq('id', canalItem.id);
          throw new Error('Informe pelo menos um resultado do sorteio.');
        }

        const { error: resultadoError } = await supabase.rpc('criar_resultado_sorteio', {
          canal_id: canalItem.id,
          data_sorteio_param: data.resultado_sorteio.data_sorteio,
          premios_param: data.resultado_sorteio.premios,
        });

        if (resultadoError) {
          await supabase.from('canal_informativo').delete().eq('id', canalItem.id);
          throw new Error(`Erro ao criar resultado de sorteio: ${resultadoError.message}`);
        }
      }

      return canalItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar publicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, resultado_sorteio, ...data }: UpdateCanalInformativoData) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('Usuário não autenticado');

      const { data: itemAtual, error: itemAtualError } = await supabase
        .from('canal_informativo')
        .select('id, tipo_conteudo')
        .eq('id', id)
        .single();

      if (itemAtualError) throw itemAtualError;

      const { error: updateError } = await supabase
        .from('canal_informativo')
        .update({
          titulo: data.titulo.trim(),
          conteudo: limparValorOpcional(data.conteudo),
          tipo_conteudo: data.tipo_conteudo,
          url_midia: limparValorOpcional(data.url_midia),
          link_externo: limparValorOpcional(data.link_externo),
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (data.tipo_conteudo === 'resultado_sorteio') {
        if (!resultado_sorteio?.data_sorteio) {
          throw new Error('A data do sorteio é obrigatória.');
        }

        const premiosValidos = resultado_sorteio.premios.filter(
          (premio) => premio.milhar.trim() || premio.grupo.trim()
        );

        if (premiosValidos.length === 0) {
          throw new Error('Informe pelo menos um resultado do sorteio.');
        }

        const { data: resultadoExistente, error: resultadoBuscaError } = await supabase
          .from('resultados_sorteio')
          .select('id')
          .eq('canal_informativo_id', id)
          .maybeSingle();

        if (resultadoBuscaError) throw resultadoBuscaError;

        if (resultadoExistente) {
          const { error: resultadoUpdateError } = await supabase
            .from('resultados_sorteio')
            .update({
              data_sorteio: resultado_sorteio.data_sorteio,
              premios: resultado_sorteio.premios,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', resultadoExistente.id);

          if (resultadoUpdateError) throw resultadoUpdateError;
        } else {
          const { error: resultadoCreateError } = await supabase.rpc('criar_resultado_sorteio', {
            canal_id: id,
            data_sorteio_param: resultado_sorteio.data_sorteio,
            premios_param: resultado_sorteio.premios,
          });

          if (resultadoCreateError) throw resultadoCreateError;
        }
      } else if (itemAtual.tipo_conteudo === 'resultado_sorteio') {
        const { error: resultadoDeleteError } = await supabase
          .from('resultados_sorteio')
          .delete()
          .eq('canal_informativo_id', id);

        if (resultadoDeleteError) throw resultadoDeleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar publicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canal_informativo')
        .update({
          ativo: false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação removida com sucesso!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover publicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    items: canalQuery.data || [],
    loading: canalQuery.isLoading,
    createItem: createMutation.mutate,
    createItemAsync: createMutation.mutateAsync,
    updateItem: updateMutation.mutate,
    updateItemAsync: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch: canalQuery.refetch,
  };
};
