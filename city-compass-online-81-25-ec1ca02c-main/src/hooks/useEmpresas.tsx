
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEmpresas = (cidadeId?: string, categoriaId?: string) => {
  return useQuery({
    queryKey: ['empresas', cidadeId, categoriaId],
    queryFn: async () => {
      let query = supabase
        .from('empresas')
        .select(`
          *,
          categorias(nome),
          cidades(nome),
          estatisticas(*)
        `)
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('verificado', { ascending: false })
        .order('criado_em', { ascending: false });

      if (cidadeId) {
        query = query.eq('cidade_id', cidadeId);
      }
      
      if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};

export const useEmpresasDestaque = (cidadeId: string) => {
  return useQuery({
    queryKey: ['empresas-destaque', cidadeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('buscar_empresas_destaque', {
        cidade_id_param: cidadeId,
        limite: 6
      });
      
      if (error) throw error;
      return data;
    },
  });
};

// Função para verificar se uma string é um UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const useEmpresaById = (id: string) => {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: async () => {
      console.log('🔍 useEmpresaById - Iniciando busca com parâmetro:', id);
      console.log('🔍 useEmpresaById - Tipo do parâmetro:', typeof id);
      
      if (!id || id === 'undefined' || id.trim() === '') {
        console.error('❌ useEmpresaById - ID inválido:', id);
        throw new Error('ID da empresa é obrigatório');
      }

      const isUUID = isValidUUID(id);
      console.log('🔍 useEmpresaById - É UUID?', isUUID);

      let data, error;

      if (isUUID) {
        // Se for UUID, buscar por ID
        console.log('🔍 useEmpresaById - Buscando por ID (UUID):', id);
        const result = await supabase
          .from('empresas')
          .select(`
            *,
            categorias(nome, icone_url),
            cidades(nome),
            estatisticas(*),
            avaliacoes(
              *,
              usuarios(nome)
            )
          `)
          .eq('id', id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
        console.log('🔍 useEmpresaById - Resultado busca por ID:', { data, error });
      } else {
        // Se não for UUID, buscar por slug
        console.log('🔍 useEmpresaById - Buscando por slug:', id);
        const result = await supabase
          .from('empresas')
          .select(`
            *,
            categorias(nome, icone_url),
            cidades(nome),
            estatisticas(*),
            avaliacoes(
              *,
              usuarios(nome)
            )
          `)
          .eq('slug', id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
        console.log('🔍 useEmpresaById - Resultado busca por slug:', { data, error });
      }
      
      if (error) {
        console.error('❌ useEmpresaById - Erro na busca:', error);
        throw error;
      }
      
      if (!data) {
        console.error('❌ useEmpresaById - Empresa não encontrada:', id);
        throw new Error('Empresa não encontrada');
      }
      
      console.log('✅ useEmpresaById - Empresa encontrada:', data.nome);
      return data;
    },
    enabled: !!id && id !== 'undefined' && id.trim() !== '',
  });
};
