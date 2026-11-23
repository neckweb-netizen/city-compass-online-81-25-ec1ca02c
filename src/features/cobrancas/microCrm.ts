import { parseBrazilianNumber } from '@/lib/parseBrazilianNumber';

export type CobrancaStatus = 'pendente' | 'paga';
export interface CobrancaCliente { id: string; nome: string; telefone: string; criadoEm: string }
export interface CobrancaRegistro {
  id: string; clienteId: string; descricao: string; valorCentavos: number;
  vencimento: string; status: CobrancaStatus; criadoEm: string; pagoEm: string | null;
}
export interface CobrancaDados { versao: 1; clientes: CobrancaCliente[]; cobrancas: CobrancaRegistro[] }

export const EMPTY_COBRANCAS: CobrancaDados = { versao: 1, clientes: [], cobrancas: [] };
export const cobrancasStorageKey = (userId: string) => 'sajtem:microcrm:v1:' + userId;
// A cópia de sincronização não deve sobrescrever a chave histórica de backups locais.
export const cobrancasSyncCacheKey = (userId: string) => 'sajtem:microcrm:sync:v1:' + userId;

export const formatCobrancaMoney = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

export const parseCobrancaCentavos = (input: string): number | null => {
  const n = parseBrazilianNumber(input);
  if (n === null || !Number.isFinite(n) || n <= 0 || n > 1_000_000_000) return null;
  const cents = Math.round(n * 100);
  return Math.abs(cents / 100 - n) < 0.00000001 ? cents : null;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
};
const isTimestamp = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
const isSafeId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(v);

export function validarBackupCobrancas(input: unknown): CobrancaDados | null {
  if (!isObject(input) || input.versao !== 1 || !Array.isArray(input.clientes) || !Array.isArray(input.cobrancas)) return null;
  if (input.clientes.length > 5000 || input.cobrancas.length > 20000) return null;
  const ids = new Set<string>();
  const clientes: CobrancaCliente[] = [];
  for (const c of input.clientes) {
    if (!isObject(c) || !isSafeId(c.id) || ids.has(c.id) ||
      typeof c.nome !== 'string' || !c.nome.trim() || c.nome.length > 120 ||
      typeof c.telefone !== 'string' || c.telefone.length > 25 ||
      !isTimestamp(c.criadoEm)) return null;
    ids.add(c.id);
    clientes.push({ id: c.id, nome: c.nome, telefone: c.telefone, criadoEm: c.criadoEm });
  }
  const charges = new Set<string>();
  const cobrancas: CobrancaRegistro[] = [];
  for (const c of input.cobrancas) {
    if (!isObject(c) || !isSafeId(c.id) || charges.has(c.id) || !ids.has(String(c.clienteId)) ||
      typeof c.descricao !== 'string' || !c.descricao.trim() || c.descricao.length > 300 ||
      !Number.isSafeInteger(c.valorCentavos) || Number(c.valorCentavos) <= 0 || Number(c.valorCentavos) > 100_000_000_000 ||
      !isDate(c.vencimento) || (c.status !== 'pendente' && c.status !== 'paga') ||
      !isTimestamp(c.criadoEm) || (c.pagoEm !== null && !isTimestamp(c.pagoEm)) ||
      (c.status === 'paga' && c.pagoEm === null) ||
      (c.status === 'pendente' && c.pagoEm !== null)) return null;
    charges.add(c.id);
    cobrancas.push({
      id: c.id, clienteId: String(c.clienteId), descricao: c.descricao,
      valorCentavos: Number(c.valorCentavos), vencimento: c.vencimento,
      status: c.status, criadoEm: c.criadoEm, pagoEm: c.pagoEm,
    });
  }
  return { versao: 1, clientes, cobrancas };
}

export const telefoneWhatsapp = (value: string): string | null => {
  const digits = value.replace(/\D/g, '');
  const full = digits.startsWith('55') ? digits : '55' + digits;
  return /^55\d{10,11}$/.test(full) ? full : null;
};

export const hojeLocal = (): string => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
};
