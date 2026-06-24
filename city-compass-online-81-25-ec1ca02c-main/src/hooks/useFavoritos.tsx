
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFavoritos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ['favoritos'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          *,
          empresas(
            id,
            nome,
            endereco,
            imagem_capa_url,
            categorias(nome),
            estatisticas(
              media_avaliacoes,
              total_avaliacoes
            )
          )
        `)
        .eq('usuario_id', user.user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const adicionarFavorito = useMutation({
    mutationFn: async (empresaId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favoritos')
        .insert({
          usuario_id: user.user.id,
          empresa_id: empresaId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
      toast({
        title: "Adicionado aos favoritos!",
        description: "A empresa foi adicionada à sua lista de favoritos.",
      });
    },
    onError: (error) => {
      console.error('Erro ao adicionar favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar aos favoritos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const removerFavorito = useMutation({
    mutationFn: async (empresaId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', user.user.id)
        .eq('empresa_id', empresaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
      toast({
        title: "Removido dos favoritos",
        description: "A empresa foi removida da sua lista de favoritos.",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover favorito:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover dos favoritos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const verificarFavorito = (empresaId: string) => {
    return favoritos.some(fav => fav.empresa_id === empresaId);
  };

  return {
    favoritos,
    isLoading,
    adicionarFavorito,
    removerFavorito,
    verificarFavorito,
  };
};
