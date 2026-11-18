import { supabase } from '@/integrations/supabase/client';

// Both environment opt-in AND explicit room scope are required.
// Defaults to OFF in all environments, including production deployments.
const permittedRoomIds = new Set(
  (import.meta.env.VITE_DOMINO_V2_ALLOWED_ROOM_IDS ?? '')
    .split(',')
    .map((id: string) => id.trim().toLowerCase())
    .filter(Boolean),
);

export const isDominoV2EnabledForRoom = (roomId: string): boolean =>
  import.meta.env.VITE_DOMINO_V2_ENABLED === 'true' &&
  permittedRoomIds.has(roomId.toLowerCase());

async function invokeV2<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  // RPC prototypes are not yet in generated DB types. Use a narrow bridge
  // until the schema is regenerated from an isolated Supabase staging project.
  const { data, error } = await (supabase as any).rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export type DominoV2Move = {
  pedra: { valorOriginal: string; ladoEsquerdo: number; ladoDireito: number };
  ponta_esquerda: number;
  ponta_direita: number;
  proxima_vez_usuario_id: string | null;
  pecas_restantes: number;
};

export type DominoV2Pass = {
  proxima_vez_usuario_id: string | null;
  nova_contagem_passadas: number;
  jogo_trancado: boolean;
  passe_em: string;
};

export async function obterMaoDominoV2(salaId: string): Promise<string[]> {
  const rows = await invokeV2<Array<{ pedra: string }>>('domino_v2_minha_mao', {
    p_sala_id: salaId,
  });
  if (!Array.isArray(rows) || rows.some(row => typeof row?.pedra !== 'string')) {
    throw new Error('Resposta inválida ao carregar as peças seguras.');
  }
  return rows.map(row => row.pedra);
}

export async function iniciarMaoDominoV2(salaId: string): Promise<string[]> {
  // The database rejects unapproved rooms. There is no legacy fallback.
  await invokeV2<boolean>('domino_v2_iniciar_maos', { p_sala_id: salaId });
  return obterMaoDominoV2(salaId);
}

export function jogarDominoV2(
  salaId: string,
  pedra: string,
  lado: 'esquerda' | 'direita',
): Promise<DominoV2Move> {
  return invokeV2('domino_v2_jogar', {
    p_sala_id: salaId,
    p_pedra: pedra,
    p_lado: lado,
  });
}

export function passarDominoV2(salaId: string): Promise<DominoV2Pass> {
  return invokeV2('domino_v2_passar', {
    p_sala_id: salaId,
    p_motivo: 'sem_peca',
  });
}
