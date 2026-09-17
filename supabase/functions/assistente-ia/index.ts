import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ListObjectsV2Command, S3Client } from "https://esm.sh/@aws-sdk/client-s3@3.1109.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";
import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from "../_shared/security.ts";
import { platformAnswer } from "./platform-answers.ts";
import { findSiteFaq } from "./site-faq.ts";
import { readKnowledge, saveKnowledgeArticle, type KnowledgeArticle } from "./knowledge-r2.ts";
import { answerKnowledgeFollowUp, findKnowledgeArticle, isKnowledgeFollowUp } from "./knowledge-match.ts";

type Company = {
  id: string;
  nome: string;
  descricao: string | null;
  endereco: string | null;
  telefone: string | null;
  slug: string | null;
  categoria_id: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_HASH = /^[0-9a-f]{64}$/;
const stopwords = new Set([
  "a", "as", "o", "os", "de", "da", "das", "do", "dos", "em", "na", "no", "um", "uma", "eu", "quero", "preciso", "achar", "encontrar", "buscar", "procuro", "perto", "mim", "por", "favor", "tem", "alguma", "algum", "que", "com", "agora", "aqui", "me", "mostre", "onde", "estou", "para", "cidade", "santo", "antonio", "jesus", "aberta", "aberto",
]);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function searchTerms(message: string): string[] {
  return normalize(message).replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word)).slice(0, 4);
}

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

function publicCompany(company: Company) {
  return {
    id: company.id,
    name: company.nome.trim(),
    description: company.descricao?.slice(0, 180) || null,
    address: company.endereco,
    profileUrl: `/locais/${encodeURIComponent(company.slug || company.id)}`,
  };
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
      if (!Array.isArray(session.context?.result_ids) || !session.context.result_ids.includes(companyId)) {
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
    let priorIds: string[] = [];
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
      priorIds = Array.isArray(session.context?.result_ids) ? session.context.result_ids.filter((id: unknown) => typeof id === "string" && UUID.test(id)).slice(0, 5) : [];
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

    const { data: eligible, error: eligibleError } = await db.rpc("ai_eligible_companies", { p_limit: 1000 });
    if (eligibleError) throw new HttpError(503, "Busca indisponível");
    const allowedIds = (eligible || []).map((item: { company_id: string }) => item.company_id);
    const { data: companyRows, error: companyError } = allowedIds.length
      ? await db.from("empresas").select("id,nome,descricao,endereco,telefone,slug,categoria_id").in("id", allowedIds)
      : { data: [] as Company[], error: null };
    if (companyError) throw new HttpError(503, "Busca indisponível");
    // PostgREST does not preserve the order of ids passed to .in(). The RPC
    // ranks paid, current plans first, so restore that order before matching.
    const orderById = new Map(allowedIds.map((id: string, index: number) => [id, index]));
    const companies = ((companyRows || []) as Company[])
      .sort((a, b) => (orderById.get(a.id) ?? 1000) - (orderById.get(b.id) ?? 1000));
    const categoryIds = [...new Set(companies.map(item => item.categoria_id).filter((id): id is string => Boolean(id)))];
    const { data: categoryRows, error: categoryError } = categoryIds.length
      ? await db.from("categorias").select("id,nome").in("id", categoryIds)
      : { data: [] as { id: string; nome: string }[], error: null };
    if (categoryError) throw new HttpError(503, "Busca indisponível");
    const categoryNames = new Map((categoryRows || []).map(item => [item.id, item.nome]));
    const searchable = (item: Company) => normalize(`${item.nome} ${item.descricao || ""} ${categoryNames.get(item.categoria_id || "") || ""}`);
    const ordinal = /\b(primeir[ao]|segund[ao]|terceir[ao])\b/i.exec(normalize(message));
    const position = ordinal ? ({ primeiro: 0, primeira: 0, segundo: 1, segunda: 1, terceiro: 2, terceira: 2 } as Record<string, number>)[ordinal[1]] : undefined;
    let matches: Company[] = [];
    let knowledgeArticle: KnowledgeArticle | null = null;
    if (position !== undefined && priorIds[position]) {
      const selected = companies.find(item => item.id === priorIds[position]);
      if (selected) matches = [selected];
    } else {
      const terms = searchTerms(message);
      const direct = companies.filter(item => terms.length > 0 && terms.some(term => searchable(item).includes(term)));
      matches = direct.slice(0, 5);
    }
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
    const responseText = knowledgeArticle ? (contextualArticle ? answerKnowledgeFollowUp(message, knowledgeArticle) : knowledgeArticle.answer) : (matches.length
      ? matches.length === 1 ? `Encontrei ${matches[0].nome.trim()}. Confira os dados no perfil antes de entrar em contato.` : `Encontrei ${matches.length} opções. Veja os perfis e me diga qual deseja conhecer melhor.`
      : companies.length
        ? "Não encontrei uma empresa correspondente nessa busca. Tente outro termo ou explore os locais cadastrados."
        : /\b(empresa|loja|local|restaurante|pizzaria|barbearia|servico|comprar|onde|encontrar|buscar|procuro|perto)\b/.test(normalize(message))
          ? "Ainda não há empresas habilitadas para recomendações da IA. Você pode explorar os locais cadastrados na busca tradicional."
          : "Posso explicar recursos do Saj Tem ou ajudar a procurar empresas da cidade. Diga o que gostaria de saber ou qual tipo de local procura.");
    const { error: messagesError } = await db.from("ai_messages").insert([
      { session_id: sessionId, role: "user", content: message },
      { session_id: sessionId, role: "assistant", content: responseText },
    ]);
    if (messagesError) throw new HttpError(503, "Não foi possível guardar a conversa");
    const { error: contextError } = await db.from("ai_sessions")
      .update({ context: { token_hash: await sha256(sessionToken), result_ids: matches.map(item => item.id), article_id: knowledgeArticle?.id || null } }).eq("id", sessionId);
    if (contextError) throw new HttpError(503, "Não foi possível atualizar a conversa");
    const { error: searchEventError } = await db.from("ai_events").insert({ session_id: sessionId, event_type: matches.length || knowledgeArticle ? "search" : "no_result" });
    if (searchEventError) throw new HttpError(503, "Não foi possível registrar a busca");
    if (matches.length) {
      const { error: impressionsError } = await db.from("ai_events").upsert(matches.map((item, index) => ({
        session_id: sessionId, company_id: item.id, event_type: "impression", result_position: index + 1,
        dedupe_key: `${sessionId}:${item.id}:impression`,
      })), { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (impressionsError) throw new HttpError(503, "Não foi possível registrar os resultados");
    }
    const links = matches.length ? [] : knowledgeArticle?.sourceUrl
      ? [{ label: "Ver fonte", url: knowledgeArticle.sourceUrl }]
      : [{ label: "Explorar locais", url: "/locais" }];
    return jsonResponse(req, { sessionId, sessionToken, text: responseText, results: matches.map(publicCompany), links });
  } catch (error) {
    return errorResponse(req, error);
  }
});
