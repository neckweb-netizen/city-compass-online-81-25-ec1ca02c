import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProdutorLocal {
  id: string;
  usuario_id: string;
  empresa_id: string | null;
  nome_publico: string;
  tipo: string;
  descricao: string | null;
  comunidade: string | null;
  municipio: string;
  telefone_whatsapp: string | null;
  produtos: string[];
  certificacoes: string[];
  entrega: boolean;
  varejo: boolean;
  atacado: boolean;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useProducaoLocalDisponivel = () => useQuery({
  queryKey: ['producao-local', 'disponibilidade'],
  queryFn: async ({ signal }) => {
    const controller = new AbortController();
    const abortRequest = () => controller.abort();
    const timeout = window.setTimeout(abortRequest, 6_000);
    signal.addEventListener('abort', abortRequest, { once: true });

    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema' as any)
        .select('producao_local_ativa')
        .limit(1)
        .abortSignal(controller.signal)
        .maybeSingle();

      if (error) {
        console.warn('[producao-local] Não foi possível consultar a disponibilidade.', error.message);
        return true;
      }

      return data ? (data as any).producao_local_ativa !== false : true;
    } catch (error) {
      console.warn('[producao-local] Consulta de disponibilidade interrompida.', error);
      return true;
    } finally {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abortRequest);
    }
  },
  placeholderData: true,
  refetchOnMount: 'always',
  retry: false,
  staleTime: 60_000,
});

export const useProdutoresLocais = () => useQuery({
  queryKey: ['produtores-locais', 'aprovados'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('produtores_locais' as any)
      .select('*')
      .eq('status', 'aprovado')
      .eq('ativo', true)
      .order('nome_publico');

    if (error) throw error;
    return (data ?? []) as ProdutorLocal[];
  },
});

export const useProdutosRurais = () => useQuery({
  queryKey: ['produtos', 'producao-local'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('id,nome,descricao,categoria_produto,tags,preco_original,preco_promocional,imagem_principal_url,link_compra,link_whatsapp,empresas(id,nome,slug,verificado)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .limit(120);

    if (error) throw error;
    return (data ?? []) as any[];
  },
});
