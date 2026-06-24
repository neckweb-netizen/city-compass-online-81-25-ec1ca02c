
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Calendar, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';

export const CouponsContent = () => {
  const { toast } = useToast();
  const { data: cidadePadrao } = useCidadePadrao();

  const { data: cupons, isLoading } = useQuery({
    queryKey: ['cupons-publicos', cidadePadrao?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cupons')
        .select(`
          *,
          empresas(nome, id, cidade_id)
        `)
        .eq('ativo', true)
        .gte('data_fim', new Date().toISOString())
        .order('criado_em', { ascending: false });

      if (error) throw error;
      
      // Filtrar por cidade se disponível
      if (cidadePadrao?.id) {
        return data.filter(cupom => cupom.empresas?.cidade_id === cidadePadrao.id);
      }
      
      return data;
    },
    enabled: !!cidadePadrao
  });

  const copyToClipboard = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast({
      title: "Código copiado!",
      description: "O código do cupom foi copiado para a área de transferência.",
    });
  };

  if (isLoading) {
    return (
      <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">🎟️ Cupons</h1>
          <p className="text-muted-foreground">
            Aproveite as melhores promoções da cidade
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando cupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">🎟️ Cupons</h1>
        <p className="text-muted-foreground">
          Aproveite as melhores promoções da cidade
        </p>
      </div>

      {cupons && cupons.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {cupons.map((cupom) => (
            <NeonCard key={cupom.id} className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{cupom.titulo}</h3>
                        <div className="flex items-center space-x-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{cupom.empresas?.nome}</span>
                        </div>
                      </div>
                    </div>
                    
                    {cupom.descricao && (
                      <p className="text-sm text-muted-foreground">{cupom.descricao}</p>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Válido até {new Date(cupom.data_fim).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="w-px bg-border mx-2 my-4"></div>
                  
                  <div className="w-28 p-4 text-center space-y-3 bg-gradient-to-b from-yellow-100 to-orange-100">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {cupom.tipo === 'porcentagem' ? `${cupom.valor}%` : `R$${cupom.valor}`}
                      </div>
                      <div className="text-xs text-muted-foreground">DESCONTO</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-muted/50 px-2 py-1 rounded text-xs font-mono">
                        {cupom.codigo}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(cupom.codigo)}
                        className="w-full h-8 text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </NeonCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">🎟️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Nenhum cupom disponível</h3>
            <p className="text-muted-foreground">
              Fique atento! Em breve teremos ótimas promoções para você.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
