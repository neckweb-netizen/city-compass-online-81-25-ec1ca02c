import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cidade padrão é configurada no banco; navegar pelo site jamais deve criá-la.
export const CIDADE_PADRAO_ID = "550e8400-e29b-41d4-a716-446655440000";
export const CIDADE_PADRAO_NOME = "Santo Antônio de Jesus";

export const useCidadePadrao = () => {
  return useQuery({
    queryKey: ['cidade-padrao'],
    queryFn: async () => {
      const { data: cidade, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('id', CIDADE_PADRAO_ID)
        .maybeSingle();

      // A falha de rede/permissão não significa que a cidade foi apagada.
      // Nunca transformar um erro de leitura em tentativa de INSERT de visitante.
      if (error) throw error;
      if (cidade) return cidade;

      // Compatibilidade com instalações antigas, com ID diferente.
      const { data: cidadePorNome, error: erroNome } = await supabase
        .from('cidades')
        .select('*')
        .eq('slug', 'santo-antonio-de-jesus')
        .eq('ativo', true)
        .maybeSingle();

      if (erroNome) throw erroNome;
      if (!cidadePorNome) throw new Error('Cidade padrão não cadastrada no sistema.');
      return cidadePorNome;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
};

export const useCidadeData = () => {
  const query = useCidadePadrao();
  return { ...query, cidade: query.data };
};
