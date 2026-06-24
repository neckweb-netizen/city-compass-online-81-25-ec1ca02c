
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ID fixo para Santo Antônio de Jesus
export const CIDADE_PADRAO_ID = "550e8400-e29b-41d4-a716-446655440000";
export const CIDADE_PADRAO_NOME = "Santo Antônio de Jesus";

export const useCidadePadrao = () => {
  return useQuery({
    queryKey: ['cidade-padrao'],
    queryFn: async () => {
      // Primeiro, tenta buscar a cidade pelo ID fixo
      let { data: cidade, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('id', CIDADE_PADRAO_ID)
        .single();

      // Se não encontrar pelo ID, busca por nome
      if (error || !cidade) {
        const { data: cidadePorNome, error: erroNome } = await supabase
          .from('cidades')
          .select('*')
          .ilike('nome', '%Santo Antônio de Jesus%')
          .eq('ativo', true)
          .single();

        if (cidadePorNome) {
          cidade = cidadePorNome;
        }
      }

      // Se ainda não encontrou, cria a cidade padrão
      if (!cidade) {
        const { data: novaCidade, error: erroCreate } = await supabase
          .from('cidades')
          .insert({
            id: CIDADE_PADRAO_ID,
            nome: CIDADE_PADRAO_NOME,
            slug: 'santo-antonio-de-jesus',
            estado: 'BA',
            ativo: true,
            descricao: 'Cidade padrão do sistema'
          })
          .select()
          .single();

        if (erroCreate) {
          console.error('Erro ao criar cidade padrão:', erroCreate);
          throw erroCreate;
        }

        cidade = novaCidade;
      }

      return cidade;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

// Helper hook that returns both data and cidade property for backward compatibility
export const useCidadeData = () => {
  const query = useCidadePadrao();
  return {
    ...query,
    cidade: query.data
  };
};
