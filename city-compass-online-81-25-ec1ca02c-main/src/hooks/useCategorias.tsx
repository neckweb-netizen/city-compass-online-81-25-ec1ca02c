
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategorias = (tipo?: 'empresa' | 'evento' | 'servico') => {
  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      let query = supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook específico para categorias de serviços
export const useCategoriasServicos = () => {
  return useCategorias('servico');
};

// Hook específico para categorias de empresas
export const useCategoriasEmpresas = () => {
  return useCategorias('empresa');
};

// Hook específico para categorias de eventos
export const useCategoriasEventos = () => {
  return useCategorias('evento');
};
