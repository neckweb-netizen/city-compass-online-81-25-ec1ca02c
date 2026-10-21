import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DirectoryBusiness, HealthService, InnovationChallenge, LocalRequest, ViverSajModule } from '@/features/viver-saj/types';

export const useViverSajModules = () => useQuery({
  queryKey: ['viver-saj', 'modulos'],
  queryFn: async () => {
    const { data, error } = await supabase.from('viver_saj_modulos' as any).select('*').eq('ativo', true).order('ordem');
    if (error) throw error;
    return (data ?? []) as ViverSajModule[];
  },
  staleTime: 5 * 60 * 1000,
});

export const useHealthServices = () => useQuery({
  queryKey: ['viver-saj', 'saude'],
  queryFn: async () => {
    const { data, error } = await supabase.from('servicos_saude_saj' as any).select('*')
      .eq('ativo', true).order('atendimento_24h', { ascending: false }).order('nome');
    if (error) throw error;
    return (data ?? []) as HealthService[];
  },
});

const useModuleBusinesses = (module: 'saude' | 'mobilidade') => useQuery({
  queryKey: ['viver-saj', module, 'empresas'],
  queryFn: async () => {
    const [categoryLinks, curated] = await Promise.all([
      supabase.from('viver_saj_categorias' as any)
        .select('categoria_id').eq('modulo', module).eq('ativo', true).order('ordem'),
      supabase.from('viver_saj_empresas' as any)
        .select('ordem,empresas!inner(id,nome,slug,descricao,endereco,telefone,verificado,ativo,status_aprovacao,categorias(nome))')
        .eq('modulo', module).eq('ativo', true)
        .eq('empresas.ativo', true).eq('empresas.status_aprovacao', 'aprovado').order('ordem'),
    ]);
    if (categoryLinks.error) throw categoryLinks.error;
    if (curated.error) throw curated.error;

    const categoryIds = (categoryLinks.data ?? []).map((item: any) => item.categoria_id);
    let automatic: any[] = [];
    if (categoryIds.length > 0) {
      const result = await supabase.from('empresas')
        .select('id,nome,slug,descricao,endereco,telefone,verificado,categoria_id,categorias(nome)')
        .eq('ativo', true).eq('status_aprovacao', 'aprovado').in('categoria_id', categoryIds)
        .order('verificado', { ascending: false }).order('nome').limit(100);
      if (result.error) throw result.error;
      automatic = result.data ?? [];
    }

    const selected = (curated.data ?? []).map((row: any) => ({ ...row.empresas, categoria: row.empresas?.categorias?.nome ?? null }));
    const categorized = automatic.map((item: any) => ({ ...item, categoria: item.categorias?.nome ?? null }));
    return [...new Map([...selected, ...categorized].map(item => [item.id, item])).values()] as DirectoryBusiness[];
  },
});

export const useHealthBusinesses = () => useModuleBusinesses('saude');

export const useMyLocalRequests = (userId?: string) => useQuery({
  queryKey: ['viver-saj', 'pedidos', userId],
  enabled: Boolean(userId),
  queryFn: async () => {
    const { data, error } = await supabase.from('pedidos_locais' as any)
      .select('*,pedido_local_respostas(id,mensagem,preco_estimado,status,criado_em,empresas(nome,slug))')
      .eq('usuario_id', userId!).order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LocalRequest[];
  },
});

export const useInnovationChallenges = () => useQuery({
  queryKey: ['viver-saj', 'desafios'],
  queryFn: async () => {
    const { data, error } = await supabase.from('desafios_inovacao' as any).select('*')
      .eq('status', 'publicado').order('criado_em', { ascending: false });
    if (error) throw error;
    return (data ?? []) as InnovationChallenge[];
  },
});

export const useSajNow = () => useQuery({
  queryKey: ['viver-saj', 'agora'],
  queryFn: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 14);
    const { data, error } = await supabase.from('eventos')
      .select('id,titulo,descricao,data_inicio,data_fim,hora_fim,local,endereco,gratuito,imagem_url')
      .eq('ativo', true).eq('status_aprovacao', 'aprovado').gte('data_inicio', today.toISOString()).lte('data_inicio', limit.toISOString())
      .order('data_inicio').limit(30);
    if (error) throw error;
    return data ?? [];
  },
});

export const useMadeInSaj = () => useQuery({
  queryKey: ['viver-saj', 'feito-saj'],
  queryFn: async () => {
    const { data, error } = await supabase.from('produtos')
      .select('id,nome,descricao,categoria_produto,imagem_principal_url,preco_original,preco_promocional,link_whatsapp,empresas!inner(id,nome,slug,endereco,ativo)')
      .eq('ativo', true).eq('empresas.ativo', true).eq('empresas.status_aprovacao', 'aprovado').order('destaque', { ascending: false }).limit(24);
    if (error) throw error;
    return data ?? [];
  },
});

export const useMobilityBusinesses = () => useModuleBusinesses('mobilidade');
