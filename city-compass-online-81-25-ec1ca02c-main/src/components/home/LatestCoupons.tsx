
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Calendar, Store, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LatestCouponsProps {
  cidadeId?: string;
}

export const LatestCoupons = ({ cidadeId }: LatestCouponsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: cupons, isLoading, error } = useQuery({
    queryKey: ['latest-cupons', cidadeId],
    queryFn: async () => {
      console.log('Buscando cupons com cidade ID:', cidadeId);
      
      let query = supabase
        .from('cupons')
        .select(`
          *,
          empresas!inner(nome, id, cidade_id)
        `)
        .eq('ativo', true)
        .gte('data_fim', new Date().toISOString())
        .order('criado_em', { ascending: false });

      // Filtrar por cidade se disponível
      if (cidadeId) {
        query = query.eq('empresas.cidade_id', cidadeId);
      }

      const { data, error } = await query.limit(3);

      if (error) {
        console.error('Erro ao buscar cupons:', error);
        throw error;
      }
      
      console.log('Cupons encontrados:', data);
      return data;
    }
  });

  const copyToClipboard = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast({
      title: "Código copiado!",
      description: "O código do cupom foi copiado para a área de transferência.",
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando cupons...</p>
        </CardContent>
      );
    }

    if (error) {
      console.error('Erro na query de cupons:', error);
      return (
        <CardContent className="text-center py-8 space-y-4">
          <div className="text-4xl">⚠️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Erro ao carregar cupons</h3>
            <p className="text-muted-foreground text-sm">
              Ocorreu um erro ao buscar os cupons. Tente novamente.
            </p>
          </div>
        </CardContent>
      );
    }

    if (!cupons || cupons.length === 0) {
      return (
        <CardContent className="text-center py-8 space-y-4">
          <div className="text-4xl">🎟️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Nenhum cupom disponível</h3>
            <p className="text-muted-foreground text-sm">
              Fique atento! Em breve teremos ótimas promoções para você.
            </p>
          </div>
        </CardContent>
      );
    }

    return (
      <CardContent className="space-y-3 p-3 sm:p-6 pt-0">
        {cupons.map((cupom) => (
          <Card key={cupom.id} className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 overflow-hidden">
            <CardContent className="p-0">
              {/* Layout responsivo: vertical no mobile, horizontal no desktop */}
              <div className="flex flex-col sm:flex-row">
                {/* Conteúdo principal */}
                <div className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base truncate">{cupom.titulo}</h3>
                      <div className="flex items-center space-x-2">
                        <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">{cupom.empresas?.nome}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Até {new Date(cupom.data_fim).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                {/* Separador - apenas no desktop */}
                <div className="hidden sm:block w-px bg-border mx-2 my-3"></div>
                
                {/* Seção do cupom */}
                <div className="w-full sm:w-24 lg:w-28 p-3 sm:p-4 text-center space-y-2 bg-gradient-to-b from-yellow-100 to-orange-100 border-t sm:border-t-0 sm:border-l border-border/20">
                  <div className="space-y-1">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                      {cupom.tipo === 'porcentagem' ? `${cupom.valor}%` : `R$${cupom.valor}`}
                    </div>
                    <div className="text-xs text-muted-foreground">OFF</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-muted/50 px-2 py-1 rounded text-xs font-mono break-all">
                      {cupom.codigo}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(cupom.codigo)}
                      className="w-full h-6 sm:h-8 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    );
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      <NeonCard className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xl sm:text-2xl">🎟️</div>
              <CardTitle className="text-base sm:text-lg">Últimos Cupons</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/?tab=coupons')}
              className="text-primary hover:text-primary/80 text-xs sm:text-sm"
            >
              Ver todos
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        {renderContent()}
      </NeonCard>
    </section>
  );
};
