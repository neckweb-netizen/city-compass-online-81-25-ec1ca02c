import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Banner {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url?: string;
  ativo: boolean;
  ordem: number;
  secao: 'home' | 'locais' | 'eventos' | 'categorias' | 'busca' | 'canal_video' | 'empresas';
  criado_em: string;
  atualizado_em: string;
}

export const useAdminBanners = (secao?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bannersQuery = useQuery({
    queryKey: ['admin-banners', secao],
    queryFn: async () => {
      console.log('Fetching banners for section:', secao);
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      let query = supabase
        .from('banners_publicitarios')
        .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
        .order('ordem', { ascending: true });

      if (secao && secao !== 'all') {
        query = query.eq('secao', secao as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching banners:', error);
        throw error;
      }
      
      console.log('Banners fetched successfully:', data);
      return data as Banner[];
    },
  });

  const createBanner = useMutation({
    mutationFn: async (banner: Omit<Banner, 'id' | 'criado_em' | 'atualizado_em'>) => {
      console.log('Creating banner with data:', banner);
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Validar dados obrigatórios
      if (!banner.titulo || !banner.imagem_url || !banner.secao) {
        throw new Error('Título, imagem e seção são obrigatórios');
      }

      // Ensure ordem is a valid integer between 1 and 999
      const ordem = Math.max(1, Math.min(999, Math.floor(Number(banner.ordem) || 1)));
      
      // Preparar dados para inserção
      const bannerData = {
        titulo: banner.titulo.trim(),
        imagem_url: banner.imagem_url,
        link_url: banner.link_url?.trim() || null,
        ativo: Boolean(banner.ativo),
        ordem: ordem,
        secao: banner.secao as any
      };

      console.log('Inserting banner data with validated ordem:', bannerData);

      const { data, error } = await supabase
        .from('banners_publicitarios')
        .insert([bannerData])
        .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
        .single();

      if (error) {
        console.error('Error creating banner:', error);
        if (error.code === '23514') {
          throw new Error('Ordem deve ser um número entre 1 e 999');
        }
        throw error;
      }

      console.log('Banner created successfully:', data);
      return data as Banner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners-publicitarios'] });
      toast({
        title: 'Banner criado',
        description: 'Banner publicitário criado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Banner creation error:', error);
      
      let errorMessage = 'Erro ao criar banner publicitário.';
      
      if (error instanceof Error) {
        if (error.message.includes('não autenticado')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
          // Redirect to login or refresh session
          window.location.reload();
          return;
        }
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const duplicateBanner = useMutation({
    mutationFn: async ({ id, newSecao }: { id: string; newSecao: Banner['secao'] }) => {
      console.log('Duplicating banner:', id, 'to section:', newSecao);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Buscar o banner original
      const { data: originalBanner, error: fetchError } = await supabase
        .from('banners_publicitarios')
        .select('titulo, imagem_url, link_url, ativo, ordem')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching original banner:', fetchError);
        throw fetchError;
      }

      // Criar novo banner baseado no original
      const duplicatedBannerData = {
        titulo: `${originalBanner.titulo} (Cópia)`,
        imagem_url: originalBanner.imagem_url,
        link_url: originalBanner.link_url,
        ativo: originalBanner.ativo,
        ordem: originalBanner.ordem,
        secao: newSecao as any
      };

      console.log('Creating duplicated banner:', duplicatedBannerData);

      const { data, error } = await supabase
        .from('banners_publicitarios')
        .insert([duplicatedBannerData])
        .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
        .single();

      if (error) {
        console.error('Error duplicating banner:', error);
        throw error;
      }

      console.log('Banner duplicated successfully:', data);
      return data as Banner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners-publicitarios'] });
      toast({
        title: 'Banner duplicado',
        description: 'Banner duplicado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Banner duplication error:', error);
      
      let errorMessage = 'Erro ao duplicar banner.';
      
      if (error instanceof Error) {
        if (error.message.includes('não autenticado')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
          window.location.reload();
          return;
        }
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...banner }: Partial<Banner> & { id: string }) => {
      console.log('Updating banner:', id, banner);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Preparar dados para atualização
      const updateData: any = {};
      
      if (banner.titulo) updateData.titulo = banner.titulo.trim();
      if (banner.imagem_url) updateData.imagem_url = banner.imagem_url;
      if (banner.link_url !== undefined) updateData.link_url = banner.link_url?.trim() || null;
      if (banner.ativo !== undefined) updateData.ativo = Boolean(banner.ativo);
      if (banner.ordem !== undefined) {
        updateData.ordem = Math.max(1, Math.min(999, Math.floor(Number(banner.ordem) || 1)));
      }
      if (banner.secao) updateData.secao = banner.secao as any;

      const { data, error } = await supabase
        .from('banners_publicitarios')
        .update(updateData)
        .eq('id', id)
        .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
        .single();

      if (error) {
        console.error('Error updating banner:', error);
        if (error.code === '23514') {
          throw new Error('Ordem deve ser um número entre 1 e 999');
        }
        throw error;
      }

      console.log('Banner updated successfully:', data);
      return data as Banner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners-publicitarios'] });
      toast({
        title: 'Banner atualizado',
        description: 'Banner publicitário atualizado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Banner update error:', error);
      
      let errorMessage = 'Erro ao atualizar banner publicitário.';
      
      if (error instanceof Error) {
        if (error.message.includes('não autenticado')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
          window.location.reload();
          return;
        }
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting banner:', id);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      const { error } = await supabase
        .from('banners_publicitarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting banner:', error);
        throw error;
      }

      console.log('Banner deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners-publicitarios'] });
      toast({
        title: 'Banner removido',
        description: 'Banner publicitário removido com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Banner deletion error:', error);
      
      let errorMessage = 'Erro ao remover banner publicitário.';
      
      if (error instanceof Error) {
        if (error.message.includes('não autenticado')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
          window.location.reload();
          return;
        }
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    banners: bannersQuery.data || [],
    isLoading: bannersQuery.isLoading,
    error: bannersQuery.error,
    createBanner,
    updateBanner,
    deleteBanner,
    duplicateBanner,
  };
};
