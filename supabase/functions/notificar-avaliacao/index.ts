import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Método não permitido" }, 405);
  try {
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(req, "notificar-avaliacao", 10, 60_000, user.id);
    const body = await req.json();
    if (!/^[0-9a-f-]{36}$/i.test(body?.avaliacao_id ?? "") ||
        !/^[0-9a-f-]{36}$/i.test(body?.empresa_id ?? "")) {
      throw new HttpError(400, "Identificador inválido");
    }
    const { data: avaliacao, error } = await admin.from("avaliacoes")
      .select("id").eq("id", body.avaliacao_id).eq("empresa_id", body.empresa_id)
      .eq("usuario_id", user.id).maybeSingle();
    if (error) throw error;
    if (!avaliacao) throw new HttpError(403, "Avaliação não autorizada");

    // A integração de envio não está configurada nesta função. Não exponha
    // o contato privado do proprietário nem dados informados pelo cliente.
    return jsonResponse(req, { success: true, message: "Avaliação confirmada" });
  } catch (error) {
    return errorResponse(req, error);
  }
});
