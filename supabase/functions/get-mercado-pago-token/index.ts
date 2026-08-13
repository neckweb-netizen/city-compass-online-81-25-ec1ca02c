import { corsHeaders, jsonResponse } from "../_shared/security.ts";

// Este endpoint existia apenas para devolver uma credencial secreta ao navegador.
// Ele permanece como resposta 410 por compatibilidade durante a retirada da função.
Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  return jsonResponse(req, { error: "Endpoint removido por segurança" }, 410);
});
