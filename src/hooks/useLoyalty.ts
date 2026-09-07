import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const db = supabase as any;

export interface LoyaltyProgram {
  id: string;
  empresa_id: string;
  ativo: boolean;
  nome: string;
  descricao: string | null;
  recompensa_descricao: string;
  carimbos_necessarios: number;
  rotulo_carimbo: string;
  cor_principal: string;
  termos: string | null;
  validade_dias: number | null;
  bonus_boas_vindas: number;
  created_at: string;
}

export interface LoyaltyOwnerCard {
  card_id: string;
  public_token: string;
  cliente_nome: string;
  cliente_email: string;
  saldo: number;
  total_carimbos: number;
  total_resgates: number;
  ultimo_movimento: string | null;
  adesao_em: string;
}

export interface MyLoyaltyCard {
  id: string;
  public_token: string;
  saldo: number;
  total_carimbos: number;
  total_resgates: number;
  ultimo_movimento: string | null;
  created_at: string;
  loyalty_programs: LoyaltyProgram & {
    empresas: { nome: string; slug: string; imagem_capa_url: string | null };
  };
}

export const useLoyaltyProgram = (empresaId?: string) => useQuery({
  queryKey: ['loyalty-program', empresaId],
  queryFn: async () => {
    const { data, error } = await db.from('loyalty_programs').select('*').eq('empresa_id', empresaId).maybeSingle();
    if (error) throw error;
    return data as LoyaltyProgram | null;
  },
  enabled: Boolean(empresaId),
});

export const useLoyaltyManager = (empresaId?: string) => {
  const queryClient = useQueryClient();
  const programQuery = useLoyaltyProgram(empresaId);
  const programId = programQuery.data?.id;

  const cardsQuery = useQuery({
    queryKey: ['loyalty-owner-cards', programId],
    queryFn: async () => {
      const { data, error } = await db.rpc('loyalty_owner_cards', { p_program_id: programId });
      if (error) throw error;
      return (data || []) as LoyaltyOwnerCard[];
    },
    enabled: Boolean(programId),
  });

  const saveProgram = useMutation({
    mutationFn: async (values: Partial<LoyaltyProgram>) => {
      const payload = { ...values, empresa_id: empresaId };
      delete (payload as any).id;
      delete (payload as any).created_at;
      const { data, error } = await db.from('loyalty_programs')
        .upsert(payload, { onConflict: 'empresa_id' }).select('*').single();
      if (error) throw error;
      return data as LoyaltyProgram;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-program', empresaId] }),
  });

  const applyTransaction = useMutation({
    mutationFn: async ({ token, tipo, quantidade = 1, observacao = '' }: {
      token: string; tipo: 'credito' | 'resgate'; quantidade?: number; observacao?: string;
    }) => {
      const { data, error } = await db.rpc('loyalty_apply_transaction', {
        p_public_token: token,
        p_tipo: tipo,
        p_quantidade: quantidade,
        p_observacao: observacao,
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-owner-cards', programId] });
      queryClient.invalidateQueries({ queryKey: ['my-loyalty-cards'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
    },
  });

  return { programQuery, cardsQuery, saveProgram, applyTransaction };
};

export const useJoinLoyaltyProgram = (empresaId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const programQuery = useLoyaltyProgram(empresaId);
  const programId = programQuery.data?.id;

  const cardQuery = useQuery({
    queryKey: ['loyalty-card', programId, user?.id],
    queryFn: async () => {
      const { data, error } = await db.from('loyalty_cards').select('*')
        .eq('program_id', programId).eq('usuario_id', user?.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(programId && user),
  });

  const join = useMutation({
    mutationFn: async () => {
      if (!user || !programId) throw new Error('Entre na sua conta para participar.');
      const { data, error } = await db.from('loyalty_cards')
        .insert({ program_id: programId, usuario_id: user.id }).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-card', programId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-loyalty-cards'] });
    },
  });

  return { programQuery, cardQuery, join, user };
};

export const useMyLoyaltyCards = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-loyalty-cards', user?.id],
    queryFn: async () => {
      const { data, error } = await db.from('loyalty_cards').select(`
        id, public_token, saldo, total_carimbos, total_resgates, ultimo_movimento, created_at,
        loyalty_programs!inner(*, empresas!inner(nome, slug, imagem_capa_url))
      `).eq('usuario_id', user?.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MyLoyaltyCard[];
    },
    enabled: Boolean(user),
  });
};

export const useLoyaltyTransactions = (cardId?: string) => useQuery({
  queryKey: ['loyalty-transactions', cardId],
  queryFn: async () => {
    const { data, error } = await db.from('loyalty_transactions').select('*')
      .eq('card_id', cardId).order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    return data || [];
  },
  enabled: Boolean(cardId),
});
