
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  resultado_sorteio?: {
    id: string;
    data_sorteio: string;
    premios: Array<{
      premio: string;
      milhar: string;
      grupo: string;
    }>;
  };
}

export interface CreateCanalInformativoData {
  titulo: string;
  conteudo?: string;
  tipo_conteudo: 'noticia' | 'video' | 'imagem' | 'resultado_sorteio';
  url_midia?: string;
  link_externo?: string;
  resultado_sorteio?: {
    data_sorteio: string;
    premios: Array<{
      premio: string;
      milhar: string;
      grupo: string;
    }>;
  };
}

export const useCanalInformativo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canalQuery = useQuery({
    queryKey: ['canal-informativo'],
    queryFn: async () => {
      console.log('Buscando dados do canal informativo...');
      
      // Buscar itens do canal informativo
      const { data: canalData, error: canalError } = await supabase
        .from('canal_informativo')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (canalError) {
        console.error('Erro ao buscar canal informativo:', canalError);
        throw canalError;
      }

      console.log('Dados do canal informativo:', canalData);

      // Processar cada item e buscar dados relacionados de sorteio se necessário
      const canalItems = await Promise.all(
        canalData.map(async (item) => {
          console.log('Processando item:', item.id, 'tipo:', item.tipo_conteudo);
          
          if (item.tipo_conteudo === 'resultado_sorteio') {
            try {
              console.log('Buscando resultado de sorteio para item:', item.id);
              
              // Usar função RPC para buscar resultados do sorteio
              const { data: rpcData, error: rpcError } = await supabase
                .rpc('buscar_resultado_sorteio', { canal_id: item.id });

              if (rpcError) {
                console.error('Erro no RPC buscar_resultado_sorteio:', rpcError);
                return { ...item, resultado_sorteio: undefined };
              }

              console.log('Dados do RPC buscar_resultado_sorteio:', rpcData);
              const resultado = Array.isArray(rpcData) ? rpcData[0] : rpcData;
              
              return {
                ...item,
                resultado_sorteio: resultado ? {
                  id: resultado.id,
                  data_sorteio: resultado.data_sorteio,
                  premios: Array.isArray(resultado.premios) ? resultado.premios : []
                } : undefined
              };
              
            } catch (error) {
              console.error('Erro ao processar resultado do sorteio:', error);
              return { ...item, resultado_sorteio: undefined };
            }
          }
          return item;
        })
      );

      console.log('Itens processados finais:', canalItems);
      return canalItems as CanalInformativoItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCanalInformativoData) => {
      console.log('Criando item do canal:', data);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('Usuário não autenticado');

      const { data: canalItem, error: canalError } = await supabase
        .from('canal_informativo')
        .insert([{
          titulo: data.titulo,
          conteudo: data.conteudo,
          tipo_conteudo: data.tipo_conteudo,
          url_midia: data.url_midia,
          link_externo: data.link_externo,
          autor_id: user.user.id
        }])
        .select()
        .single();

      if (canalError) {
        console.error('Erro ao criar item do canal:', canalError);
        throw canalError;
      }

      console.log('Item do canal criado:', canalItem);

      // Se for resultado de sorteio, criar o registro relacionado usando RPC
      if (data.tipo_conteudo === 'resultado_sorteio' && data.resultado_sorteio) {
        console.log('Criando resultado de sorteio:', data.resultado_sorteio);
        
        try {
          const { error: resultadoError } = await supabase
            .rpc('criar_resultado_sorteio', {
              canal_id: canalItem.id,
              data_sorteio_param: data.resultado_sorteio.data_sorteio,
              premios_param: data.resultado_sorteio.premios
            });

          if (resultadoError) {
            console.error('Erro ao criar resultado de sorteio:', resultadoError);
            throw new Error(`Erro ao criar resultado de sorteio: ${resultadoError.message}`);
          } else {
            console.log('Resultado de sorteio criado com sucesso');
          }
        } catch (error) {
          console.error('Erro ao chamar RPC criar_resultado_sorteio:', error);
          throw error;
        }
      }

      return canalItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação criada com sucesso!' });
    },
    onError: (error: any) => {
      console.error('Erro na criação:', error);
      toast({ 
        title: 'Erro ao criar publicação', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CanalInformativoItem> & { id: string }) => {
      const { error } = await supabase
        .from('canal_informativo')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação atualizada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar publicação', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canal_informativo')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canal-informativo'] });
      toast({ title: 'Publicação removida com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao remover publicação', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    items: canalQuery.data || [],
    loading: canalQuery.isLoading,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    refetch: canalQuery.refetch,
  };
};
