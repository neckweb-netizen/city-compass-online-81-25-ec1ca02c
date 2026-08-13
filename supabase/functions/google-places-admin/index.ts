import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";

type RequestBody =
  | { action: "search"; query: string }
  | { action: "import"; placeId: string; categoryId: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    const { admin } = await requireUser(req, ["admin_geral", "admin_cidade"]);
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) throw new HttpError(500, "Integração com Google Maps não configurada");

    const body = await req.json() as RequestBody;
    if (body.action === "search") {
      const query = body.query?.trim();
      if (!query || query.length > 200) throw new HttpError(400, "Busca inválida");
      const { data, error } = await admin.rpc("buscar_locais_google", {
        busca_termo: query,
        google_key: apiKey,
      });
      if (error) throw error;
      return jsonResponse(req, data);
    }

    if (body.action === "import") {
      if (!body.placeId || !body.categoryId) throw new HttpError(400, "Dados de importação inválidos");
      const { data, error } = await admin.rpc("importar_detalhes_google", {
        p_place_id: body.placeId,
        google_key: apiKey,
        p_categoria_id: body.categoryId,
      });
      if (error) throw error;
      return jsonResponse(req, data);
    }

    throw new HttpError(400, "Ação inválida");
  } catch (error) {
    return errorResponse(req, error);
  }
});
