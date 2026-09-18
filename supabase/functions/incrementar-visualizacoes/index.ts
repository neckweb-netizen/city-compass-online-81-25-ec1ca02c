import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse } from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Método não permitido" }, 405);
  try {
    const body = await req.json();
    const empresaId = body?.empresa_id;
    if (typeof empresaId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empresaId)) {
      throw new HttpError(400, "Identificador inválido");
    }
    await enforceRateLimit(req, `incrementar-visualizacoes:${empresaId}`, 5, 600_000);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: empresa, error: companyError } = await admin.from("empresas")
      .select("id, nome").eq("id", empresaId).eq("ativo", true).maybeSingle();
    if (companyError) throw companyError;
    if (!empresa) throw new HttpError(404, "Empresa não encontrada");

    const { data: total, error } = await admin.rpc("incrementar_visualizacao_empresa", {
      p_empresa_id: empresaId,
    });
    if (error) throw error;
    return jsonResponse(req, { success: true, empresa_id: empresaId, total_visualizacoes: total });
  } catch (error) {
    return errorResponse(req, error);
  }
});
