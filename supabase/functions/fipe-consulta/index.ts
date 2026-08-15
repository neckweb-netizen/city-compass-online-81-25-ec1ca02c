import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  enforceRateLimit,
  errorResponse,
  HttpError,
  jsonResponse,
  requireUser,
} from "../_shared/security.ts";

const FIPE_API_URL = "https://fipe.parallelum.com.br/api/v2";
const CACHE_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS: Record<Exclude<Action, "usage">, number> = {
  references: 6 * 60 * 60 * 1_000,
  brands: 7 * 24 * 60 * 60 * 1_000,
  models: 7 * 24 * 60 * 60 * 1_000,
  years: 7 * 24 * 60 * 60 * 1_000,
  details: 6 * 60 * 60 * 1_000,
};
const vehicleTypes = new Set(["cars", "motorcycles", "trucks"]);
const safeNumericId = /^\d+$/;
const safeYearId = /^\d{4}-\d$/;

type Action = "usage" | "references" | "brands" | "models" | "years" | "details";

interface RequestBody {
  action?: Action;
  vehicleType?: string;
  brandId?: string;
  modelId?: string;
  yearId?: string;
  reference?: string;
}

type AdminClient = Awaited<ReturnType<typeof requireUser>>["admin"];

interface DailyUsage {
  used: number;
  remaining: number;
  limit: number;
  date: string;
}

interface SheetCacheResponse {
  ok?: boolean;
  hit?: boolean;
  data?: unknown;
}

function getBahiaDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function getDailyUsage(admin: AdminClient, userId: string, date: string): Promise<DailyUsage> {
  const { error: cleanupError } = await admin
    .from("fipe_daily_usage")
    .delete()
    .eq("user_id", userId)
    .lt("usage_date", date);
  if (cleanupError) console.error("Não foi possível limpar usos FIPE antigos", cleanupError.code);

  const { count, error } = await admin
    .from("fipe_daily_usage")
    .select("slot", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("usage_date", date);

  if (error) throw new HttpError(500, "Não foi possível verificar o limite diário");
  const used = count ?? 0;
  return { used, remaining: Math.max(0, 2 - used), limit: 2, date };
}

async function reserveDailyUsage(admin: AdminClient, userId: string, date: string): Promise<{ slot: number; usage: DailyUsage }> {
  for (const slot of [1, 2]) {
    const { error } = await admin.from("fipe_daily_usage").insert({
      user_id: userId,
      usage_date: date,
      slot,
    });

    if (!error) return { slot, usage: await getDailyUsage(admin, userId, date) };
    if (error.code !== "23505") throw new HttpError(500, "Não foi possível registrar a consulta");
  }

  throw new HttpError(429, "Você já utilizou suas 2 consultas FIPE de hoje. O limite será renovado amanhã.");
}

async function releaseDailyUsage(admin: AdminClient, userId: string, date: string, slot: number): Promise<void> {
  const { error } = await admin
    .from("fipe_daily_usage")
    .delete()
    .eq("user_id", userId)
    .eq("usage_date", date)
    .eq("slot", slot);
  if (error) console.error("Não foi possível liberar a reserva de uso FIPE", error.code);
}

function requireVehicleType(value?: string): string {
  if (!value || !vehicleTypes.has(value)) {
    throw new HttpError(400, "Tipo de veículo inválido");
  }
  return value;
}

function requireNumericId(value: string | undefined, field: string): string {
  if (!value || !safeNumericId.test(value)) {
    throw new HttpError(400, `${field} inválido`);
  }
  return value;
}

function buildPath(body: RequestBody): string {
  if (body.action === "references") return "/references";

  const vehicleType = requireVehicleType(body.vehicleType);
  if (body.action === "brands") return `/${vehicleType}/brands`;

  const brandId = requireNumericId(body.brandId, "Marca");
  if (body.action === "models") return `/${vehicleType}/brands/${brandId}/models`;

  const modelId = requireNumericId(body.modelId, "Modelo");
  if (body.action === "years") {
    return `/${vehicleType}/brands/${brandId}/models/${modelId}/years`;
  }

  if (body.action === "details") {
    if (!body.yearId || !safeYearId.test(body.yearId)) {
      throw new HttpError(400, "Ano inválido");
    }
    return `/${vehicleType}/brands/${brandId}/models/${modelId}/years/${body.yearId}`;
  }

  throw new HttpError(400, "Consulta inválida");
}

function buildCacheKey(body: RequestBody): string {
  return [
    "fipe-v1",
    body.action ?? "",
    body.vehicleType ?? "",
    body.brandId ?? "",
    body.modelId ?? "",
    body.yearId ?? "",
    body.reference ?? "",
  ].map((value) => encodeURIComponent(value)).join(":");
}

function getSheetCacheConfig(): { url: string; secret: string } | null {
  const url = Deno.env.get("FIPE_SHEETS_WEB_APP_URL");
  const secret = Deno.env.get("FIPE_SHEETS_SECRET");
  return url && secret ? { url, secret } : null;
}

async function callSheetCache(payload: Record<string, unknown>): Promise<SheetCacheResponse | null> {
  const config = getSheetCacheConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CACHE_TIMEOUT_MS);
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, secret: config.secret }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const result = await response.json() as SheetCacheResponse;
    return result.ok ? result : null;
  } catch (error) {
    console.error("Cache FIPE no Google Sheets indisponível", error instanceof Error ? error.name : "erro");
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readFromSheetCache(cacheKey: string): Promise<SheetCacheResponse | null> {
  return await callSheetCache({ operation: "get", cacheKey });
}

async function writeToSheetCache(
  cacheKey: string,
  body: RequestBody,
  data: unknown,
): Promise<void> {
  const action = body.action as Exclude<Action, "usage">;
  await callSheetCache({
    operation: "put",
    cacheKey,
    action,
    vehicleType: body.vehicleType,
    brandId: body.brandId,
    modelId: body.modelId,
    yearId: body.yearId,
    reference: body.reference,
    response: data,
    expiresAt: new Date(Date.now() + CACHE_TTL_MS[action]).toISOString(),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");

    enforceRateLimit(req, "fipe-consulta", 60, 60_000);
    const { user, admin } = await requireUser(req);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Dados da consulta inválidos");
    }

    const usageDate = getBahiaDate();
    if (body.action === "usage") {
      return jsonResponse(req, { data: await getDailyUsage(admin, user.id, usageDate) });
    }

    const path = buildPath(body);
    const upstreamUrl = new URL(`${FIPE_API_URL}${path}`);
    if (body.reference) {
      upstreamUrl.searchParams.set("reference", requireNumericId(body.reference, "Referência"));
    }

    let reservation: { slot: number; usage: DailyUsage } | null = null;
    if (body.action === "details") {
      reservation = await reserveDailyUsage(admin, user.id, usageDate);
    }

    try {
      const cacheKey = buildCacheKey(body);
      const cached = await readFromSheetCache(cacheKey);
      if (cached?.hit && cached.data !== undefined) {
        return jsonResponse(req, { data: cached.data, usage: reservation?.usage, cached: true });
      }

      const apiKey = Deno.env.get("FIPE_API_KEY");
      if (!apiKey) throw new HttpError(503, "Consulta FIPE temporariamente indisponível");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12_000);
      let response: Response;
      try {
        response = await fetch(upstreamUrl, {
          headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 429) {
        throw new HttpError(429, "Limite de consultas do serviço FIPE atingido. Tente novamente mais tarde.");
      }
      if (response.status === 404) throw new HttpError(404, "Veículo não encontrado");
      if (!response.ok) throw new HttpError(502, "Não foi possível consultar a Tabela FIPE");

      const data = await response.json();
      await writeToSheetCache(cacheKey, body, data);
      return jsonResponse(req, { data, usage: reservation?.usage, cached: false });
    } catch (error) {
      if (reservation) {
        await releaseDailyUsage(admin, user.id, usageDate, reservation.slot);
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new HttpError(504, "A Tabela FIPE demorou para responder. Tente novamente.");
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});
