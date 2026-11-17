
import { useQuery } from '@tanstack/react-query';

export const useCategorias = (tipo?: 'empresa' | 'evento' | 'servico', enabled = true) => {
  return useQuery({
    queryKey: ['categorias', tipo],
    enabled,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const url = '/api/public-catalog?resource=categories' + (tipo ? '&type=' + encodeURIComponent(tipo) : '');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Não foi possível carregar as categorias.');
      return await response.json() as { id: string; nome: string; tipo: string; ativo: boolean; [key: string]: any }[];

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
