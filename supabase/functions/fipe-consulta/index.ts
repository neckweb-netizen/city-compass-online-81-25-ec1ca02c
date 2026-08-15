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
const vehicleTypes = new Set(["cars", "motorcycles", "trucks"]);
const safeNumericId = /^\d+$/;
const safeYearId = /^\d{4}-\d$/;

type Action = "references" | "brands" | "models" | "years" | "details";

interface RequestBody {
  action?: Action;
  vehicleType?: string;
  brandId?: string;
  modelId?: string;
  yearId?: string;
  reference?: string;
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");

    enforceRateLimit(req, "fipe-consulta", 60, 60_000);
    await requireUser(req);

    const apiKey = Deno.env.get("FIPE_API_KEY");
    if (!apiKey) throw new HttpError(503, "Consulta FIPE temporariamente indisponível");

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Dados da consulta inválidos");
    }

    const path = buildPath(body);
    const upstreamUrl = new URL(`${FIPE_API_URL}${path}`);
    if (body.reference) {
      upstreamUrl.searchParams.set("reference", requireNumericId(body.reference, "Referência"));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);
    let response: Response;
    try {
      response = await fetch(upstreamUrl, {
        headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new HttpError(504, "A Tabela FIPE demorou para responder. Tente novamente.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 429) {
      throw new HttpError(429, "Limite de consultas atingido. Tente novamente mais tarde.");
    }
    if (response.status === 404) throw new HttpError(404, "Veículo não encontrado");
    if (!response.ok) throw new HttpError(502, "Não foi possível consultar a Tabela FIPE");

    const data = await response.json();
    return jsonResponse(req, { data });
  } catch (error) {
    return errorResponse(req, error);
  }
});
