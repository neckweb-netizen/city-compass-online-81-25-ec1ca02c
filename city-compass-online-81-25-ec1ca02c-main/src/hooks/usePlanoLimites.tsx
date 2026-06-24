import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaEmpresa } from './useMinhaEmpresa';
import { useToast } from '@/hooks/use-toast';

export const usePlanoLimites = () => {
  const { empresa } = useMinhaEmpresa();
  const { toast } = useToast();

  const { data: planoAtual, isLoading } = useQuery({
    queryKey: ['plano-limites', empresa?.plano_atual_id, empresa?.plano_data_vencimento],
    queryFn: async () => {
      // Verificar se o plano está expirado
      const planoExpirado = empresa?.plano_data_vencimento && 
        new Date(empresa.plano_data_vencimento) < new Date();

      if (!empresa?.plano_atual_id || planoExpirado) {
        // Retorna plano gratuito padrão se não tem plano ou está expirado
        return {
          limite_cupons: 0,
          limite_produtos: 2,
          produtos_destaque_permitidos: 0,
          acesso_eventos: false,
          prioridade_destaque: 0,
          suporte_prioritario: false,
          nome: 'Gratuito',
          expirado: planoExpirado,
          data_vencimento: empresa?.plano_data_vencimento
        };
      }

      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('id', empresa.plano_atual_id)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar plano:', error);
        throw error;
      }

      return {
        ...data,
        expirado: false,
        data_vencimento: empresa?.plano_data_vencimento
      };
    },
    enabled: !!empresa,
  });

  const verificarLimiteCupons = async (): Promise<boolean> => {
    if (!empresa || !planoAtual) return false;

    const { count } = await supabase
      .from('cupons')
      .select('id', { count: 'exact' })
      .eq('empresa_id', empresa.id)
      .eq('ativo', true);

    const limiteAtingido = (count || 0) >= planoAtual.limite_cupons;
    
    if (limiteAtingido) {
      toast({
        title: 'Limite atingido',
        description: `Seu plano ${planoAtual.nome} permite apenas ${planoAtual.limite_cupons} cupons ativos.`,
        variant: 'destructive',
      });
    }

    return !limiteAtingido;
  };

  const verificarLimiteEventos = async (): Promise<boolean> => {
    if (!empresa || !planoAtual) return false;

    if (!planoAtual.acesso_eventos) {
      toast({
        title: 'Recurso não disponível',
        description: `Seu plano ${planoAtual.nome} não inclui acesso a eventos. Faça upgrade do seu plano.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const verificarLimiteProdutos = async (): Promise<boolean> => {
    if (!empresa || !planoAtual) return false;

    const { count } = await supabase
      .from('produtos')
      .select('id', { count: 'exact' })
      .eq('empresa_id', empresa.id)
      .eq('ativo', true);

    const limiteAtingido = (count || 0) >= planoAtual.limite_produtos;
    
    if (limiteAtingido) {
      toast({
        title: 'Limite atingido',
        description: `Seu plano ${planoAtual.nome} permite apenas ${planoAtual.limite_produtos} produtos ativos.`,
        variant: 'destructive',
      });
    }

    return !limiteAtingido;
  };

  const verificarLimiteProdutosDestaque = async (): Promise<boolean> => {
    if (!empresa || !planoAtual) return false;

    const { count } = await supabase
      .from('produtos')
      .select('id', { count: 'exact' })
      .eq('empresa_id', empresa.id)
      .eq('ativo', true)
      .eq('destaque', true);

    const limiteAtingido = (count || 0) >= planoAtual.produtos_destaque_permitidos;
    
    if (limiteAtingido) {
      toast({
        title: 'Limite atingido',
        description: `Seu plano ${planoAtual.nome} permite apenas ${planoAtual.produtos_destaque_permitidos} produtos em destaque.`,
        variant: 'destructive',
      });
    }

    return !limiteAtingido;
  };

  const podeAtivarDestaque = (): boolean => {
    if (!planoAtual) return false;
    return planoAtual.prioridade_destaque > 0;
  };

  const temSuportePrioritario = (): boolean => {
    return planoAtual?.suporte_prioritario || false;
  };

  return {
    planoAtual,
    isLoading,
    verificarLimiteCupons,
    verificarLimiteEventos,
    verificarLimiteProdutos,
    verificarLimiteProdutosDestaque,
    podeAtivarDestaque,
    temSuportePrioritario,
  };
};