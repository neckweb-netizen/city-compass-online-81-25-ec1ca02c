import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ListObjectsV2Command, S3Client } from "https://esm.sh/@aws-sdk/client-s3@3.1109.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";
import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";
import { conversationalFallback, platformAnswer } from "./platform-answers.ts";
import { findSiteFaq } from "./site-faq.ts";
import { readKnowledge, saveKnowledgeArticle, type KnowledgeArticle } from "./knowledge-r2.ts";
import { answerKnowledgeFollowUp, findKnowledgeArticle, isKnowledgeFollowUp } from "./knowledge-match.ts";
import {
  detectIntents, formatPrice, isNearbyQuery, normalizeText, ordinalIndex, rankLocalItems, shouldSearchCatalog, TOOL_ITEMS,
  type LocalSearchItem, type SearchKind,
} from "./local-search.ts";

type Company = {
  id: string;
  nome: string;
  descricao: string | null;
  endereco: string | null;
  telefone: string | null;
  slug: string | null;
  categoria_id: string | null;
  localizacao: unknown;
  horario_funcionamento: unknown;
  agendamentos_ativo: boolean | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_HASH = /^[0-9a-f]{64}$/;

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyPublicKey(req: Request): Promise<void> {
  const key = req.headers.get("apikey");
  if (!key || key.length > 512) throw new HttpError(401, "Chave pública inválida");
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  let publishable: Record<string, string> = {};
  try { publishable = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"); } catch { /* legacy only */ }
  if (key === legacy || Object.values(publishable).includes(key)) return;
  // Older clients can still use a valid legacy key even when the Edge runtime
  // exposes only the newer publishable-key dictionary.
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new HttpError(503, "Validação indisponível");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: controller.signal });
    if (!response.ok) throw new HttpError(401, "Chave pública inválida");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Validação indisponível");
  } finally {
    clearTimeout(timer);
  }
}

function publicResult(item: LocalSearchItem) {
  return {
    id: item.id,
    kind: item.kind,
    name: item.name.trim(),
    description: item.description?.slice(0, 220) || null,
    address: item.address,
    profileUrl: item.url,
    actionLabel: item.kind === "company" || item.kind === "product" || item.kind === "coupon" || item.kind === "booking"
      ? "Abrir perfil" : item.kind === "event" ? "Ver evento" : item.kind === "tool" ? "Abrir ferramenta" : "Ver oportunidades",
    companyId: item.companyId,
    distanceKm: item.distanceKm ?? null,
  };
}

function parsePoint(value: unknown): { longitude: number; latitude: number } | null {
  if (typeof value !== "string") return null;
  const match = /^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)$/.exec(value.trim());
  if (!match) return null;
  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  return Number.isFinite(longitude) && Number.isFinite(latitude) ? { longitude, latitude } : null;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function requestedLocation(value: unknown): { latitude: number; longitude: number } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const location = value as Record<string, unknown>;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function resultSummary(matches: LocalSearchItem[]): string {
  if (!matches.length) return "";
  const labels: Record<SearchKind, string> = {
    company: "empresa", product: "produto", coupon: "cupom", event: "evento", job: "vaga",
    service: "serviço profissional", booking: "serviço com agendamento", tool: "ferramenta",
  };
  if (matches.length === 1) return `Encontrei ${matches[0].name}, uma opção de ${labels[matches[0].kind]}. Confira os detalhes antes de entrar em contato.`;
  const kinds = [...new Set(matches.map(item => labels[item.kind]))];
  return `Encontrei ${matches.length} opções de ${kinds.join(", ")}. Abra os detalhes ou me diga qual delas deseja conhecer melhor.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    await verifyPublicKey(req);
    if (Number(req.headers.get("content-length") || 0) > 5000) throw new HttpError(413, "Mensagem muito grande");
    const rawBody = await req.text();
    if (rawBody.length > 5000) throw new HttpError(413, "Mensagem muito grande");
    let body: Record<string, unknown>;
    try { body = JSON.parse(rawBody); } catch { throw new HttpError(400, "Pedido inválido"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Pedido inválido");

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new HttpError(500, "Servidor indisponível");
    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: config, error: settingsError } = await db.from("ai_settings")
      .select("enabled,maintenance,max_message_length").eq("id", true).single();
    if (settingsError || !config) throw new HttpError(503, "Assistente indisponível");

    if (body.action === "status") {
      return jsonResponse(req, { enabled: config.enabled && !config.maintenance });
    }
    if (body.action === "knowledge_diagnostic") {
      await requireUser(req, ["admin_geral"]);
      const endpoint = Deno.env.get("AI_R2_ENDPOINT")?.replace(/\/$/, "");
      const bucket = Deno.env.get("AI_R2_BUCKET");
      const accessKeyId = Deno.env.get("AI_R2_ACCESS_KEY_ID");
      const secretAccessKey = Deno.env.get("AI_R2_SECRET_ACCESS_KEY");
      if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
        return jsonResponse(req, { configured: false, reachable: false, reason: "missing_secret" });
      }
      let endpointUrl: URL;
      try { endpointUrl = new URL(endpoint); } catch {
        return jsonResponse(req, { configured: true, reachable: false, reason: "invalid_endpoint" });
      }
      if (endpointUrl.protocol !== "https:" || !endpointUrl.hostname.endsWith(".r2.cloudflarestorage.com") || endpointUrl.pathname !== "/") {
        return jsonResponse(req, { configured: true, reachable: false, reason: "invalid_endpoint" });
      }
      try {
        const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
        const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "knowledge/", MaxKeys: 1 }));
        return jsonResponse(req, { configured: true, reachable: true, hasKnowledgeFiles: (result.KeyCount || 0) > 0 });
      } catch (error) {
        const name = error instanceof Error ? error.name : "";
        const reason = name === "AccessDenied" ? "access_denied" : name === "NoSuchBucket" ? "bucket_not_found" : "connection_failed";
        return jsonResponse(req, { configured: true, reachable: false, reason });
      }
    }
    if (body.action === "knowledge_read") {
      await requireUser(req, ["admin_geral"]);
      return jsonResponse(req, await readKnowledge(true));
    }
    if (body.action === "knowledge_save") {
      await requireUser(req, ["admin_geral"]);
      if (body.etag !== null && typeof body.etag !== "string") throw new HttpError(400, "Versão da base inválida");
      return jsonResponse(req, await saveKnowledgeArticle(body.article, body.etag as string | null));
    }
    if (body.action === "knowledge_unanswered") {
      await requireUser(req, ["admin_geral"]);
      const { data: events, error: eventError } = await db.from("ai_events")
        .select("session_id,created_at").eq("event_type", "no_result")
        .order("created_at", { ascending: false }).limit(30);
      if (eventError) throw new HttpError(503, "Não foi possível carregar as perguntas");
      const sessionIds = [...new Set((events || []).map(item => item.session_id))];
      if (!sessionIds.length) return jsonResponse(req, { questions: [] });
      const { data: messages, error: messageError } = await db.from("ai_messages")
        .select("session_id,content,created_at").eq("role", "user").in("session_id", sessionIds)
        .order("created_at", { ascending: false }).limit(150);
      if (messageError) throw new HttpError(503, "Não foi possível carregar as perguntas");
      const questions = (events || []).map(event => {
        const message = (messages || []).find(item => item.session_id === event.session_id && item.created_at <= event.created_at);
        return message ? { question: message.content.slice(0, 500), createdAt: event.created_at } : null;
      }).filter(Boolean);
      return jsonResponse(req, { questions });
    }
    if (body.action === "track") {
      const id = typeof body.sessionId === "string" ? body.sessionId : "";
      const token = typeof body.sessionToken === "string" ? body.sessionToken : "";
      const companyId = typeof body.companyId === "string" ? body.companyId : "";
      if (!UUID.test(id) || !UUID.test(companyId) || token.length < 40 || token.length > 150 || body.eventType !== "profile") {
        throw new HttpError(400, "Evento inválido");
      }
      const { data: session } = await db.from("ai_sessions").select("expires_at,context").eq("id", id).maybeSingle();
      if (!session || new Date(session.expires_at).getTime() <= Date.now() || session.context?.token_hash !== await sha256(token)) {
        throw new HttpError(403, "Sessão inválida");
      }
      const contextCompanyIds = Array.isArray(session.context?.result_ids) ? session.context.result_ids : [];
      const contextResults = Array.isArray(session.context?.results) ? session.context.results : [];
      if (!contextCompanyIds.includes(companyId) && !contextResults.some((item: { companyId?: unknown }) => item?.companyId === companyId)) {
        throw new HttpError(403, "Resultado não apresentado nesta conversa");
      }
      const { data: eligible, error: eligibleError } = await db.rpc("ai_eligible_companies", { p_limit: 1000 });
      if (eligibleError || !eligible?.some((item: { company_id: string }) => item.company_id === companyId)) {
        throw new HttpError(403, "Empresa não elegível");
      }
      const { error: eventError } = await db.from("ai_events").upsert({
        session_id: id, company_id: companyId, event_type: "profile", dedupe_key: `${id}:${companyId}:profile`,
      }, { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (eventError) throw new HttpError(503, "Não foi possível registrar a ação");
      return jsonResponse(req, { recorded: true });
    }
    if (body.action !== "chat") throw new HttpError(400, "Ação inválida");
    if (!config.enabled || config.maintenance) throw new HttpError(503, "Assistente temporariamente indisponível");

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > config.max_message_length) throw new HttpError(400, "Mensagem vazia ou acima do limite");
    const address = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const visitorHash = await sha256(`ai-visitor-v1:${serviceKey}:${address}`);
    if (!RATE_HASH.test(visitorHash)) throw new HttpError(500, "Falha no limite de uso");

    const { data: quota, error: quotaError } = await db.rpc("ai_consume_quota", { p_visitor_hash: visitorHash, p_model_call: false });
    if (quotaError) throw new HttpError(503, "Controle de uso indisponível");
    if (!quota) throw new HttpError(429, "Limite de consultas atingido. Tente novamente amanhã.");

    const incomingId = typeof body.sessionId === "string" ? body.sessionId : "";
    const incomingToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
    let sessionId = "";
    let sessionToken = "";
    let priorResults: LocalSearchItem[] = [];
    let priorArticleId = "";
    if (incomingId || incomingToken) {
      if (!UUID.test(incomingId) || incomingToken.length < 40 || incomingToken.length > 150) throw new HttpError(400, "Sessão inválida");
      const { data: session } = await db.from("ai_sessions").select("id,expires_at,context")
        .eq("id", incomingId).maybeSingle();
      if (!session || new Date(session.expires_at).getTime() <= Date.now() || session.context?.token_hash !== await sha256(incomingToken)) {
        throw new HttpError(403, "Sessão expirada. Inicie uma nova conversa.");
      }
      sessionId = incomingId;
      sessionToken = incomingToken;
      priorResults = Array.isArray(session.context?.results)
        ? session.context.results.filter((item: unknown): item is LocalSearchItem => Boolean(item && typeof item === "object" && typeof (item as LocalSearchItem).id === "string" && typeof (item as LocalSearchItem).name === "string" && typeof (item as LocalSearchItem).url === "string")).slice(0, 5)
        : [];
      priorArticleId = typeof session.context?.article_id === "string" && UUID.test(session.context.article_id) ? session.context.article_id : "";
    } else {
      sessionToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const { data: session, error: sessionError } = await db.from("ai_sessions")
        .insert({ context: { token_hash: await sha256(sessionToken), result_ids: [] } }).select("id").single();
      if (sessionError || !session) throw new HttpError(503, "Não foi possível iniciar a conversa");
      sessionId = session.id;
    }

    const faqAnswer = findSiteFaq(message);
    const siteAnswer = faqAnswer
      ? { text: faqAnswer.answer, links: [faqAnswer.link] }
      : platformAnswer(message);
    if (siteAnswer) {
      const { error: messagesError } = await db.from("ai_messages").insert([
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "assistant", content: siteAnswer.text },
      ]);
      if (messagesError) throw new HttpError(503, "Não foi possível guardar a conversa");
      const { error: contextError } = await db.from("ai_sessions")
        .update({ context: { token_hash: await sha256(sessionToken), result_ids: [], article_id: null } }).eq("id", sessionId);
      if (contextError) throw new HttpError(503, "Não foi possível atualizar a conversa");
      const { error: eventError } = await db.from("ai_events").insert({ session_id: sessionId, event_type: "search" });
      if (eventError) throw new HttpError(503, "Não foi possível registrar a busca");
      return jsonResponse(req, { sessionId, sessionToken, text: siteAnswer.text, results: [], links: siteAnswer.links });
    }

    if (!shouldSearchCatalog(message, priorResults.length > 0)) {
      const directAnswer = conversationalFallback();
      const { error: messagesError } = await db.from("ai_messages").insert([
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "assistant", content: directAnswer.text },
      ]);
      if (messagesError) throw new HttpError(503, "Não foi possível guardar a conversa");
      const { error: contextError } = await db.from("ai_sessions")
        .update({ context: { token_hash: await sha256(sessionToken), result_ids: [], article_id: null } }).eq("id", sessionId);
      if (contextError) throw new HttpError(503, "Não foi possível atualizar a conversa");
      const { error: eventError } = await db.from("ai_events").insert({ session_id: sessionId, event_type: "no_result" });
      if (eventError) throw new HttpError(503, "Não foi possível registrar a conversa");
      return jsonResponse(req, { sessionId, sessionToken, text: directAnswer.text, results: [], links: [] });
    }

    const intents = detectIntents(message);
    const normalizedMessage = normalizeText(message);
    const location = requestedLocation(body.location);
    const { data: eligible, error: eligibleError } = await db.rpc("ai_eligible_companies", { p_limit: 200 });
    if (eligibleError) throw new HttpError(503, "Busca indisponível");
    const allowedIds = (eligible || []).map((item: { company_id: string }) => item.company_id);
    const { data: companyRows, error: companyError } = allowedIds.length
      ? await db.from("empresas").select("id,nome,descricao,endereco,telefone,slug,categoria_id,localizacao,horario_funcionamento,agendamentos_ativo").in("id", allowedIds)
      : { data: [] as Company[], error: null };
    if (companyError) throw new HttpError(503, "Busca indisponível");
    const orderById = new Map(allowedIds.map((id: string, index: number) => [id, index]));
    const companies = ((companyRows || []) as Company[])
      .sort((a, b) => (orderById.get(a.id) ?? 1000) - (orderById.get(b.id) ?? 1000));
    const companyById = new Map(companies.map(company => [company.id, company]));
    const categoryIds = [...new Set(companies.map(item => item.categoria_id).filter((id): id is string => Boolean(id)))];
    const { data: categoryRows, error: categoryError } = categoryIds.length
      ? await db.from("categorias").select("id,nome").in("id", categoryIds)
      : { data: [] as { id: string; nome: string }[], error: null };
    if (categoryError) throw new HttpError(503, "Busca indisponível");
    const categoryNames = new Map((categoryRows || []).map(item => [item.id, item.nome]));
    const wants = (kind: SearchKind) => intents.length === 0 || intents.includes(kind);
    const now = new Date().toISOString();
    const empty = { data: [] as Record<string, unknown>[], error: null };
    const [productsResult, couponsResult, eventsResult, jobsResult, servicesResult, bookingResult] = await Promise.all([
      wants("product") && allowedIds.length
        ? db.from("produtos").select("id,empresa_id,nome,descricao,preco_original,preco_promocional,categoria_produto,tags,estoque_disponivel").in("empresa_id", allowedIds).eq("ativo", true).limit(200)
        : Promise.resolve(empty),
      wants("coupon") && allowedIds.length
        ? db.from("cupons").select("id,empresa_id,titulo,descricao,tipo,valor,codigo,data_inicio,data_fim").in("empresa_id", allowedIds).eq("ativo", true).lte("data_inicio", now).gte("data_fim", now).limit(200)
        : Promise.resolve(empty),
      wants("event")
        ? db.from("eventos").select("id,titulo,descricao,data_inicio,data_fim,local,endereco,gratuito,preco,empresa_id").eq("ativo", true).eq("status_aprovacao", "aprovado").gte("data_inicio", new Date(Date.now() - 86400000).toISOString()).order("data_inicio").limit(200)
        : Promise.resolve(empty),
      wants("job")
        ? db.from("vagas_emprego").select("id,titulo,descricao,requisitos,faixa_salarial,tipo_vaga").eq("ativo", true).order("criado_em", { ascending: false }).limit(200)
        : Promise.resolve(empty),
      wants("service")
        ? db.from("servicos_autonomos").select("id,nome_prestador,descricao_servico,bairros_atendimento").eq("status_aprovacao", "aprovado").order("criado_em", { ascending: false }).limit(200)
        : Promise.resolve(empty),
      wants("booking") && allowedIds.length
        ? db.from("servicos_agendamento").select("id,empresa_id,nome_servico,descricao,duracao_minutos,preco").in("empresa_id", allowedIds).eq("ativo", true).limit(200)
        : Promise.resolve(empty),
    ]);
    const catalogError = [productsResult, couponsResult, eventsResult, jobsResult, servicesResult, bookingResult].find(result => result.error)?.error;
    if (catalogError) throw new HttpError(503, "Não foi possível pesquisar todo o catálogo");

    const items: LocalSearchItem[] = companies.map(company => {
      const point = parsePoint(company.localizacao);
      return {
        id: company.id, kind: "company", name: company.nome, description: company.descricao,
        address: company.endereco, url: `/locais/${encodeURIComponent(company.slug || company.id)}`,
        companyId: company.id, companyName: company.nome, phone: company.telefone,
        bookable: company.agendamentos_ativo === true,
        keywords: [categoryNames.get(company.categoria_id || "") || "", "empresa", "local"],
        distanceKm: location && point ? distanceKm(location, point) : null,
      };
    });
    for (const row of productsResult.data || []) {
      const company = companyById.get(String(row.empresa_id));
      if (!company) continue;
      const promotional = row.preco_promocional === null ? null : Number(row.preco_promocional);
      const original = row.preco_original === null ? null : Number(row.preco_original);
      const price = Number.isFinite(promotional) ? promotional : Number.isFinite(original) ? original : null;
      items.push({
        id: String(row.id), kind: "product", name: String(row.nome), description: [row.descricao, formatPrice(price)].filter(Boolean).join(" — ") || null,
        address: company.endereco, url: `/locais/${encodeURIComponent(company.slug || company.id)}`, companyId: company.id,
        companyName: company.nome, price, keywords: ["produto", String(row.categoria_produto || ""), ...(Array.isArray(row.tags) ? row.tags.map(String) : [])],
      });
    }
    for (const row of couponsResult.data || []) {
      const company = companyById.get(String(row.empresa_id));
      if (!company) continue;
      items.push({
        id: String(row.id), kind: "coupon", name: String(row.titulo),
        description: [row.descricao, row.codigo ? `Código: ${String(row.codigo)}` : null, company.nome].filter(Boolean).join(" — "),
        address: company.endereco, url: `/locais/${encodeURIComponent(company.slug || company.id)}`, companyId: company.id,
        companyName: company.nome, keywords: ["cupom", "desconto", "promocao", String(row.tipo || "")],
      });
    }
    for (const row of eventsResult.data || []) {
      const date = new Date(String(row.data_inicio));
      const when = Number.isFinite(date.getTime()) ? date.toLocaleString("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" }) : null;
      const price = row.gratuito === true ? 0 : row.preco === null ? null : Number(row.preco);
      items.push({
        id: String(row.id), kind: "event", name: String(row.titulo),
        description: [row.descricao, when, row.gratuito === true ? "Gratuito" : formatPrice(price)].filter(Boolean).join(" — "),
        address: String(row.endereco || row.local || "") || null, url: `/eventos/${encodeURIComponent(String(row.id))}`,
        companyId: companyById.has(String(row.empresa_id || "")) ? String(row.empresa_id) : undefined,
        price, startsAt: String(row.data_inicio), keywords: ["evento", "agenda", "show", "festa"],
      });
    }
    for (const row of jobsResult.data || []) {
      items.push({
        id: String(row.id), kind: "job", name: String(row.titulo),
        description: [row.descricao, row.faixa_salarial].filter(Boolean).join(" — ") || null, address: null,
        url: "/oportunidades/vagas", keywords: ["vaga", "emprego", "trabalho", String(row.tipo_vaga || ""), String(row.requisitos || "")],
      });
    }
    for (const row of servicesResult.data || []) {
      items.push({
        id: String(row.id), kind: "service", name: String(row.nome_prestador), description: String(row.descricao_servico || "") || null,
        address: Array.isArray(row.bairros_atendimento) ? row.bairros_atendimento.map(String).join(", ") : null,
        url: "/oportunidades/servicos", keywords: ["servico", "profissional", "autonomo"],
      });
    }
    for (const row of bookingResult.data || []) {
      const company = companyById.get(String(row.empresa_id));
      if (!company?.agendamentos_ativo) continue;
      const price = row.preco === null ? null : Number(row.preco);
      items.push({
        id: String(row.id), kind: "booking", name: String(row.nome_servico),
        description: [row.descricao, formatPrice(price), row.duracao_minutos ? `${Number(row.duracao_minutos)} min` : null, company.nome].filter(Boolean).join(" — "),
        address: company.endereco, url: `/locais/${encodeURIComponent(company.slug || company.id)}`, companyId: company.id,
        companyName: company.nome, price, phone: company.telefone, bookable: true, keywords: ["agendamento", "horario", "servico"],
      });
    }
    if (wants("tool")) items.push(...TOOL_ITEMS);

    const position = ordinalIndex(message);
    const asksCheapest = /\b(mais barato|mais barata|menor preco|menor valor)\b/.test(normalizedMessage);
    const asksNearest = /\b(mais perto|mais proximo|mais proxima)\b/.test(normalizedMessage);
    const detailFollowUp = /\b(onde fica|endereco|telefone|whatsapp|quanto custa|qual o preco|agendar|marcar)\b/.test(normalizedMessage);
    let matches: LocalSearchItem[] = [];
    if (position !== null && priorResults[position]) matches = [priorResults[position]];
    else if (asksCheapest && priorResults.some(item => typeof item.price === "number")) {
      matches = [priorResults.filter(item => typeof item.price === "number").sort((a, b) => Number(a.price) - Number(b.price))[0]];
    } else if (asksNearest && priorResults.some(item => typeof item.distanceKm === "number")) {
      matches = [priorResults.filter(item => typeof item.distanceKm === "number").sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm))[0]];
    } else if (detailFollowUp && priorResults.length) matches = [priorResults[0]];
    else matches = rankLocalItems(message, items, 5);

    let knowledgeArticle: KnowledgeArticle | null = null;
    let contextualArticle = false;
    if (!matches.length && Deno.env.get("AI_R2_BUCKET")) {
      try {
        const articles = (await readKnowledge()).articles;
        knowledgeArticle = findKnowledgeArticle(message, articles);
        if (!knowledgeArticle && priorArticleId && isKnowledgeFollowUp(message)) {
          knowledgeArticle = articles.find(article => article.id === priorArticleId && article.active) || null;
          contextualArticle = Boolean(knowledgeArticle);
        }
      } catch {
        // Storage availability must not interrupt company discovery or the normal fallback.
      }
    }
    let responseText = knowledgeArticle ? (contextualArticle ? answerKnowledgeFollowUp(message, knowledgeArticle) : knowledgeArticle.answer) : resultSummary(matches);
    if (matches.length === 1 && detailFollowUp) {
      const selected = matches[0];
      if (/\b(onde fica|endereco)\b/.test(normalizedMessage)) responseText = selected.address ? `${selected.name} fica em ${selected.address}.` : `O endereço de ${selected.name} não está informado. Confira a página de detalhes.`;
      else if (/\b(quanto custa|qual o preco)\b/.test(normalizedMessage)) responseText = formatPrice(selected.price) ? `${selected.name} está anunciado por ${formatPrice(selected.price)}. Confirme o valor antes de comprar ou agendar.` : `O preço de ${selected.name} não está informado. Consulte os detalhes ou confirme com o responsável.`;
      else if (/\b(telefone|whatsapp)\b/.test(normalizedMessage)) responseText = selected.phone ? `O contato informado para ${selected.name} é ${selected.phone}. Confirme os dados no perfil antes de chamar.` : `O contato não aparece neste resultado. Abra os detalhes para verificar os canais disponíveis.`;
      else if (/\b(agendar|marcar)\b/.test(normalizedMessage)) responseText = selected.bookable ? `${selected.name} aceita solicitação de agendamento pelo perfil. Escolha o serviço e um horário disponível.` : `Este resultado não informa agendamento online. Confirme diretamente na página de detalhes.`;
    }
    if (!responseText) {
      responseText = isNearbyQuery(message) && !location
        ? "Não consegui acessar sua localização. Permita a localização quando o navegador solicitar ou informe um bairro para eu pesquisar."
        : "Não encontrei uma correspondência no catálogo atual. Tente informar outro nome, categoria, bairro ou tipo de conteúdo.";
    }
    const { error: messagesError } = await db.from("ai_messages").insert([
      { session_id: sessionId, role: "user", content: message },
      { session_id: sessionId, role: "assistant", content: responseText },
    ]);
    if (messagesError) throw new HttpError(503, "Não foi possível guardar a conversa");
    const safeContextResults = matches.map(item => ({
      id: item.id, kind: item.kind, name: item.name.slice(0, 160), description: item.description?.slice(0, 240) || null,
      address: item.address?.slice(0, 240) || null, url: item.url, companyId: item.companyId, companyName: item.companyName?.slice(0, 160),
      price: item.price ?? null, distanceKm: item.distanceKm ?? null, phone: item.phone?.slice(0, 40) || null, bookable: item.bookable === true,
    }));
    const { error: contextError } = await db.from("ai_sessions")
      .update({ context: { token_hash: await sha256(sessionToken), result_ids: matches.map(item => item.companyId).filter(Boolean), results: safeContextResults, article_id: knowledgeArticle?.id || null } }).eq("id", sessionId);
    if (contextError) throw new HttpError(503, "Não foi possível atualizar a conversa");
    const { error: searchEventError } = await db.from("ai_events").insert({ session_id: sessionId, event_type: matches.length || knowledgeArticle ? "search" : "no_result" });
    if (searchEventError) throw new HttpError(503, "Não foi possível registrar a busca");
    if (matches.length) {
      const { error: impressionsError } = await db.from("ai_events").upsert(matches.map((item, index) => ({
        session_id: sessionId, company_id: item.companyId || null, event_type: "impression", result_position: index + 1,
        dedupe_key: `${sessionId}:${item.kind}:${item.id}:impression`,
      })), { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (impressionsError) throw new HttpError(503, "Não foi possível registrar os resultados");
    }
    const links = matches.length ? [] : knowledgeArticle?.sourceUrl
      ? [{ label: "Ver fonte", url: knowledgeArticle.sourceUrl }]
      : [{ label: intents.includes("event") ? "Ver eventos" : intents.includes("job") || intents.includes("service") ? "Ver oportunidades" : intents.includes("tool") ? "Ver ferramentas" : "Explorar locais",
          url: intents.includes("event") ? "/eventos" : intents.includes("job") || intents.includes("service") ? "/oportunidades" : intents.includes("tool") ? "/ferramentas" : "/locais" }];
    return jsonResponse(req, { sessionId, sessionToken, text: responseText, results: matches.map(publicResult), links });
  } catch (error) {
    return errorResponse(req, error);
  }
});
