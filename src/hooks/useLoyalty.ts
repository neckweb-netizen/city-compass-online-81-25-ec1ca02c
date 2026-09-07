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
  loyalty_rewards?: LoyaltyReward[];
}

export interface LoyaltyReward {
  id?: string;
  program_id?: string;
  nome: string;
  descricao?: string | null;
  carimbos_necessarios: number;
  ativo: boolean;
  ordem?: number;
}

export interface LoyaltyOwnerCard {
  card_id: string;
  public_token: string;
  display_code: string;
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
  display_code: string;
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
    const { data, error } = await db.from('loyalty_programs')
      .select('*, loyalty_rewards(*)').eq('empresa_id', empresaId)
      .order('carimbos_necessarios', { referencedTable: 'loyalty_rewards', ascending: true })
      .maybeSingle();
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
      const { data, error } = await db.rpc('loyalty_owner_cards_v2', { p_program_id: programId });
      if (error) throw error;
      return (data || []) as LoyaltyOwnerCard[];
    },
    enabled: Boolean(programId),
  });

  const saveProgram = useMutation({
    mutationFn: async (values: Partial<LoyaltyProgram> & { loyalty_rewards?: LoyaltyReward[] }) => {
      const rewards = values.loyalty_rewards || [];
      const payload = { ...values, empresa_id: empresaId };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).loyalty_rewards;
      const { data, error } = await db.from('loyalty_programs')
        .upsert(payload, { onConflict: 'empresa_id' }).select('*').single();
      if (error) throw error;
      const { data: savedRewards, error: rewardsError } = await db.rpc('loyalty_replace_rewards', {
        p_program_id: data.id,
        p_rewards: rewards,
      });
      if (rewardsError) throw rewardsError;
      return { ...data, loyalty_rewards: savedRewards } as LoyaltyProgram;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-program', empresaId] }),
  });

  const applyTransaction = useMutation({
    mutationFn: async ({ identifier, tipo, quantidade = 1, rewardId, observacao = '' }: {
      identifier: string; tipo: 'credito' | 'resgate'; quantidade?: number; rewardId?: string; observacao?: string;
    }) => {
      const { data, error } = await db.rpc('loyalty_apply_transaction_v2', {
        p_card_identifier: identifier,
        p_tipo: tipo,
        p_quantidade: quantidade,
        p_reward_id: rewardId || null,
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
        id, public_token, display_code, saldo, total_carimbos, total_resgates, ultimo_movimento, created_at,
        loyalty_programs!inner(*, loyalty_rewards(*), empresas!inner(nome, slug, imagem_capa_url))
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
