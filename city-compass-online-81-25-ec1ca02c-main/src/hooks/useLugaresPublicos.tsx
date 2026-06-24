import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LugarPublico {
  id: string;
  nome: string;
  descricao?: string;
  endereco?: string;
  tipo: string;
  imagem_url?: string;
  telefone?: string;
  horario_funcionamento?: any;
  localizacao?: any;
  ativo: boolean;
  destaque: boolean;
  cidade_id: string;
  criado_em: string;
  atualizado_em: string;
}

export const useLugaresPublicos = (cidadeId?: string) => {
  return useQuery({
    queryKey: ['lugares-publicos', cidadeId],
    queryFn: async () => {
      let query = supabase
        .from('lugares_publicos')
        .select('*')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('nome');

      if (cidadeId) {
        query = query.eq('cidade_id', cidadeId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as LugarPublico[];
    },
  });
};

export const useLugaresPublicosAdmin = () => {
  return useQuery({
    queryKey: ['lugares-publicos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lugares_publicos')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLugarPublico = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: {
      nome: string;
      descricao?: string;
      endereco?: string;
      tipo: string;
      imagem_url?: string;
      telefone?: string;
      cidade_id: string;
      ativo: boolean;
      destaque: boolean;
    }) => {
      const { data, error } = await supabase
        .from('lugares_publicos')
        .insert(dados)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos-admin'] });
      toast.success('Lugar público criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar lugar público:', error);
      toast.error('Erro ao criar lugar público');
    },
  });
};

export const useUpdateLugarPublico = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<LugarPublico> & { id: string }) => {
      const { data, error } = await supabase
        .from('lugares_publicos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos-admin'] });
      toast.success('Lugar público atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar lugar público:', error);
      toast.error('Erro ao atualizar lugar público');
    },
  });
};

export const useDeleteLugarPublico = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lugares_publicos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos'] });
      queryClient.invalidateQueries({ queryKey: ['lugares-publicos-admin'] });
      toast.success('Lugar público excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir lugar público:', error);
      toast.error('Erro ao excluir lugar público');
    },
  });
};