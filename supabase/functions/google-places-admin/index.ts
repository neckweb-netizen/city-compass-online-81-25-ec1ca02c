import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const GOOGLE_CITY_CENTER = "-12.9686,-39.2610";
const GOOGLE_RADIUS_METERS = 12000;
const SAJ_CITY_ID = "550e8400-e29b-41d4-a716-446655440000";

type SearchBody = {
  action: "search";
  query: string;
  googleType?: string;
};

type ImportBody = {
  action: "import";
  placeId: string;
  categoryId: string;
};

type RequestBody = SearchBody | ImportBody;

const normalizeOpeningHours = (details: any) => {
  const openingHours = details?.opening_hours;
  const periods = Array.isArray(openingHours?.periods) ? openingHours.periods : [];
  if (periods.length === 0) return null;

  const dayKeys = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const normalized = Object.fromEntries(
    dayKeys.map((key) => [key, { aberto: false, abertura: "08:00", fechamento: "18:00" }]),
  ) as Record<string, { aberto: boolean; abertura: string; fechamento: string }>;

  const formatTime = (value: unknown, fallback: string) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length === 4 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : fallback;
  };

  for (const period of periods) {
    const dayKey = dayKeys[Number(period?.open?.day)];
    if (!dayKey) continue;

    const opening = formatTime(period?.open?.time, "00:00");
    const closing = formatTime(period?.close?.time, "23:59");
    const current = normalized[dayKey];

    normalized[dayKey] = {
      aberto: true,
      abertura: current.aberto && current.abertura < opening ? current.abertura : opening,
      fechamento: current.aberto && current.fechamento > closing ? current.fechamento : closing,
    };
  }

  return normalized;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "ERROR", error: "Método não permitido." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const authorization = req.headers.get("Authorization");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ status: "ERROR", error: "Configuração interna do Supabase ausente." }, 500);
    }

    if (!googleApiKey) {
      return json({ status: "ERROR", error: "GOOGLE_PLACES_API_KEY não está configurada na Edge Function." }, 500);
    }

    if (!authorization?.startsWith("Bearer ")) {
      return json({ status: "ERROR", error: "Sessão administrativa não encontrada." }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authorization.replace("Bearer ", "").trim();
    const { data: { user }, error: userError } = await admin.auth.getUser(token);

    if (userError || !user) {
      return json({ status: "ERROR", error: "Sessão inválida ou expirada." }, 401);
    }

    const { data: roleRows, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin_geral", "admin_cidade"])
      .limit(1);

    if (roleError) {
      console.error("Erro consultando papel do usuário:", roleError);
      return json({ status: "ERROR", error: "Não foi possível validar a permissão administrativa." }, 500);
    }

    if (!roleRows || roleRows.length === 0) {
      return json({ status: "ERROR", error: "Acesso permitido apenas para administradores." }, 403);
    }

    const body = (await req.json()) as RequestBody;

    if (!body?.action) return json({ status: "ERROR", error: "Ação não informada." }, 400);

    if (body.action === "search") {
      const query = String(body.query || "").trim();
      if (!query) return json({ status: "ERROR", error: "Informe um termo para pesquisar." }, 400);

      const params = new URLSearchParams({
        query,
        location: GOOGLE_CITY_CENTER,
        radius: String(GOOGLE_RADIUS_METERS),
        key: googleApiKey,
        language: "pt-BR",
        region: "br",
      });

      if (body.googleType) params.set("type", body.googleType);

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`);

      if (!response.ok) {
        console.error("HTTP Google Places:", response.status, await response.text());
        return json({ status: "ERROR", error: `Google Places respondeu HTTP ${response.status}.` }, 502);
      }

      const googleData = await response.json();

      if (googleData.status !== "OK" && googleData.status !== "ZERO_RESULTS") {
        console.error("Google Places search error:", googleData);
        return json({
          status: googleData.status || "ERROR",
          error_message: googleData.error_message || "A API do Google Places recusou a busca. Verifique chave, faturamento e restrições.",
        }, 502);
      }

      const results = (googleData.results || [])
        .slice(0, 20)
        .map((item: any) => ({
          place_id: item.place_id,
          name: item.name,
          formatted_address: item.formatted_address || item.vicinity || "",
        }))
        .filter((item: any) => item.place_id && item.name);

      return json({ status: googleData.status, results });
    }

    if (body.action === "import") {
      const placeId = String(body.placeId || "").trim();
      const categoryId = String(body.categoryId || "").trim();

      if (!placeId || !categoryId) {
        return json({ status: "ERROR", error: "placeId e categoryId são obrigatórios." }, 400);
      }

      const { data: category, error: categoryError } = await admin
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .eq("ativo", true)
        .maybeSingle();

      if (categoryError || !category) {
        return json({ status: "ERROR", error: "Categoria selecionada não é válida." }, 400);
      }

      const { data: alreadyImported, error: duplicateCheckError } = await admin
        .from("empresas")
        .select("id, nome")
        .eq("place_id", placeId)
        .maybeSingle();

      if (duplicateCheckError) {
        console.error("Erro verificando duplicidade:", duplicateCheckError);
        return json({ status: "ERROR", error: "Falha ao verificar se o local já foi importado." }, 500);
      }

      if (alreadyImported) {
        return json({ status: "ERROR", error: `"${alreadyImported.nome}" já está cadastrado no Guia.` }, 409);
      }

      const fields = [
        "place_id", "name", "formatted_address", "formatted_phone_number",
        "international_phone_number", "website", "url", "geometry",
        "opening_hours", "types", "business_status",
      ].join(",");

      const detailsParams = new URLSearchParams({
        place_id: placeId,
        fields,
        key: googleApiKey,
        language: "pt-BR",
      });

      const detailsResponse = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`);

      if (!detailsResponse.ok) {
        return json({ status: "ERROR", error: `Google Places respondeu HTTP ${detailsResponse.status} nos detalhes.` }, 502);
      }

      const detailsData = await detailsResponse.json();

      if (detailsData.status !== "OK" || !detailsData.result) {
        console.error("Google Places details error:", detailsData);
        return json({
          status: detailsData.status || "ERROR",
          error: detailsData.error_message || "Não foi possível obter os detalhes do estabelecimento.",
        }, 502);
      }

      const details = detailsData.result;
      const nome = String(details.name || "").trim();
      if (!nome) return json({ status: "ERROR", error: "O Google não retornou o nome do estabelecimento." }, 502);

      const slugBase = slugify(nome) || "empresa";
      let slug = slugBase;
      let suffix = 2;

      while (true) {
        const { data: slugExists, error: slugError } = await admin
          .from("empresas")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (slugError) {
          console.error("Erro verificando slug:", slugError);
          return json({ status: "ERROR", error: "Não foi possível gerar um endereço único para a empresa." }, 500);
        }

        if (!slugExists) break;
        slug = `${slugBase}-${suffix}`;
        suffix += 1;
      }

      const lat = details?.geometry?.location?.lat;
      const lng = details?.geometry?.location?.lng;
      const telefone = details.formatted_phone_number || details.international_phone_number || null;

      const payload = {
        cidade_id: SAJ_CITY_ID,
        categoria_id: categoryId,
        nome,
        slug,
        descricao: "Estabelecimento importado do Google Maps para o Guia SAJ Tem.",
        endereco: details.formatted_address || null,
        telefone,
        site: details.website || null,
        horario_funcionamento: normalizeOpeningHours(details),
        localizacao: typeof lat === "number" && typeof lng === "number" ? `(${lng},${lat})` : null,
        destaque: false,
        verificado: false,
        ativo: true,
        status_aprovacao: "aprovado",
        data_aprovacao: new Date().toISOString(),
        aprovado_por: user.id,
        place_id: placeId,
      };

      const { data: empresa, error: insertError } = await admin
        .from("empresas")
        .insert(payload)
        .select("id, nome, slug, endereco, place_id")
        .single();

      if (insertError) {
        console.error("Erro inserindo empresa:", insertError);
        return json({ status: "ERROR", error: `Falha ao cadastrar "${nome}": ${insertError.message}` }, 500);
      }

      return json({ status: "OK", nome: empresa.nome, empresa });
    }

    return json({ status: "ERROR", error: "Ação desconhecida." }, 400);
  } catch (error) {
    console.error("Erro google-places-admin:", error);
    return json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Erro interno inesperado.",
    }, 500);
  }
});
