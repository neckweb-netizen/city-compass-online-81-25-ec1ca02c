import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";
import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse } from "../_shared/security.ts";

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,255}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "GET") return jsonResponse(req, { error: "Método não permitido" }, 405);

  try {
    const url = new URL(req.url);
    const placeId = String(url.searchParams.get("place_id") || "").trim();
    if (!PLACE_ID_PATTERN.test(placeId)) throw new HttpError(400, "Local inválido");

    await enforceRateLimit(req, "google-place-photo", 180, 60_000);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !googleApiKey) {
      throw new HttpError(503, "Serviço de imagens indisponível");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: company, error: companyError } = await admin
      .from("empresas")
      .select("id")
      .eq("place_id", placeId)
      .eq("ativo", true)
      .limit(1)
      .maybeSingle();
    if (companyError) throw new Error(`Falha ao validar empresa: ${companyError.message}`);

    let isAllowed = Boolean(company);
    if (!isAllowed) {
      const expectedUrl = `${supabaseUrl}/functions/v1/google-place-photo?${new URLSearchParams({ place_id: placeId }).toString()}`;
      const { data: publicPlace, error: publicPlaceError } = await admin
        .from("lugares_publicos")
        .select("id")
        .eq("imagem_url", expectedUrl)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (publicPlaceError) throw new Error(`Falha ao validar local público: ${publicPlaceError.message}`);
      isAllowed = Boolean(publicPlace);
    }

    if (!isAllowed) throw new HttpError(404, "Imagem não encontrada");

    const detailsParams = new URLSearchParams({
      place_id: placeId,
      fields: "photos",
      key: googleApiKey,
      language: "pt-BR",
    });
    const detailsResponse = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`);
    if (!detailsResponse.ok) throw new HttpError(502, "Não foi possível consultar a foto");

    const detailsData = await detailsResponse.json();
    if (detailsData?.status !== "OK") throw new HttpError(404, "Foto não disponível");

    const photos = (Array.isArray(detailsData?.result?.photos) ? detailsData.result.photos : []) as Array<{
      photo_reference?: unknown;
      html_attributions?: unknown;
    }>;
    const photo = photos.find((item) => item?.photo_reference);
    if (!photo?.photo_reference) throw new HttpError(404, "Foto não disponível");

    const photoParams = new URLSearchParams({
      maxwidth: "1200",
      photo_reference: photo.photo_reference,
      key: googleApiKey,
    });
    const photoResponse = await fetch(`https://maps.googleapis.com/maps/api/place/photo?${photoParams.toString()}`, {
      redirect: "follow",
    });
    const contentType = (photoResponse.headers.get("content-type") || "").toLowerCase();
    if (!photoResponse.ok || !contentType.startsWith("image/") || !photoResponse.body) {
      await photoResponse.body?.cancel();
      throw new HttpError(502, "O Google não retornou uma imagem válida");
    }

    return new Response(photoResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(req, error);
    console.error("Erro google-place-photo:", error);
    return jsonResponse(req, { error: "Não foi possível carregar a imagem" }, 500);
  }
});
