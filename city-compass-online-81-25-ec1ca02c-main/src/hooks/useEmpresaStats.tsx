
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEmpresaStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Buscar empresa do usuário
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('usuario_id', user.id)
        .single();

      if (!empresa) return null;

      // Buscar estatísticas
      const [avaliacoesResult, cuponsResult, favoritosResult] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('nota, criado_em')
          .eq('empresa_id', empresa.id),
        
        supabase
          .from('cupons')
          .select('quantidade_usada, quantidade_total')
          .eq('empresa_id', empresa.id)
          .eq('ativo', true),
        
        supabase
          .from('favoritos')
          .select('id')
          .eq('empresa_id', empresa.id)
      ]);

      const avaliacoes = avaliacoesResult.data || [];
      const cupons = cuponsResult.data || [];
      const favoritos = favoritosResult.data || [];

      // Calcular estatísticas dos últimos 30 dias
      const trinta_dias_atras = new Date();
      trinta_dias_atras.setDate(trinta_dias_atras.getDate() - 30);

      const avaliacoes_recentes = avaliacoes.filter(
        av => new Date(av.criado_em) >= trinta_dias_atras
      );

      return {
        total_avaliacoes: avaliacoes.length,
        media_avaliacoes: avaliacoes.length > 0 
          ? avaliacoes.reduce((sum, av) => sum + av.nota, 0) / avaliacoes.length 
          : 0,
        avaliacoes_mes: avaliacoes_recentes.length,
        total_favoritos: favoritos.length,
        cupons_ativos: cupons.length,
        cupons_utilizados: cupons.reduce((sum, c) => sum + (c.quantidade_usada || 0), 0),
      };
    },
    enabled: !!user,
  });
};
