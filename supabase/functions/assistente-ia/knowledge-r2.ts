import { GetObjectCommand, PutObjectCommand, S3Client } from "https://esm.sh/@aws-sdk/client-s3@3.1109.0";
import { HttpError } from "../_shared/security.ts";

const KEY = "knowledge/articles-v1.json";
const MAX_BYTES = 1_000_000;
const MAX_ARTICLES = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type KnowledgeArticle = {
  id: string;
  title: string;
  answer: string;
  keywords: string[];
  sourceUrl: string | null;
  active: boolean;
  updatedAt: string;
};

type KnowledgeFile = { version: 1; articles: KnowledgeArticle[] };
type KnowledgeSnapshot = { articles: KnowledgeArticle[]; etag: string | null };
let cached: { value: KnowledgeSnapshot; until: number } | null = null;

function storage() {
  const endpoint = Deno.env.get("AI_R2_ENDPOINT")?.replace(/\/$/, "");
  const bucket = Deno.env.get("AI_R2_BUCKET");
  const accessKeyId = Deno.env.get("AI_R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AI_R2_SECRET_ACCESS_KEY");
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new HttpError(503, "Base de conhecimento não configurada");
  let parsed: URL;
  try { parsed = new URL(endpoint); } catch { throw new HttpError(503, "Endpoint da base inválido"); }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".r2.cloudflarestorage.com") || parsed.pathname !== "/") {
    throw new HttpError(503, "Endpoint da base inválido");
  }
  return { bucket, client: new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } }) };
}

function isMissing(error: unknown): boolean {
  const value = error as { name?: string };
  return value?.name === "NoSuchKey";
}

export async function readKnowledge(fresh = false): Promise<KnowledgeSnapshot> {
  if (!fresh && cached && cached.until > Date.now()) return cached.value;
  const { client, bucket } = storage();
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: KEY }));
    if (!result.Body || (result.ContentLength || 0) > MAX_BYTES) throw new HttpError(503, "Base de conhecimento inválida");
    const raw = await result.Body.transformToString();
    if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) throw new HttpError(503, "Base de conhecimento excedeu o limite");
    const parsed = JSON.parse(raw) as KnowledgeFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.articles) || parsed.articles.length > MAX_ARTICLES) {
      throw new HttpError(503, "Formato da base de conhecimento inválido");
    }
    for (const article of parsed.articles) {
      try {
        validateArticle(article);
        if (typeof article.updatedAt !== "string" || !Number.isFinite(Date.parse(article.updatedAt))) throw new Error("invalid date");
      } catch {
        throw new HttpError(503, "Artigo inválido na base de conhecimento");
      }
    }
    const value = { articles: parsed.articles, etag: result.ETag || null };
    cached = { value, until: Date.now() + 30_000 };
    return value;
  } catch (error) {
    if (isMissing(error)) {
      const value = { articles: [], etag: null };
      cached = { value, until: Date.now() + 30_000 };
      return value;
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Não foi possível ler a base de conhecimento");
  }
}

function validateArticle(input: unknown): Omit<KnowledgeArticle, "updatedAt"> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpError(400, "Artigo inválido");
  const value = input as Record<string, unknown>;
  const id = typeof value.id === "string" ? value.id : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const answer = typeof value.answer === "string" ? value.answer.trim() : "";
  const keywords = value.keywords;
  const sourceUrl = typeof value.sourceUrl === "string" ? value.sourceUrl.trim() : null;
  if (!UUID.test(id) || !title || title.length > 120 || !answer || answer.length > 3500 ||
    !Array.isArray(keywords) || keywords.length > 12 || keywords.some(item => typeof item !== "string" || !item.trim() || item.length > 50) ||
    typeof value.active !== "boolean") throw new HttpError(400, "Título, resposta ou palavras-chave inválidos");
  if (sourceUrl && !(sourceUrl.startsWith("/") && !sourceUrl.startsWith("//")) && !/^https:\/\//i.test(sourceUrl)) {
    throw new HttpError(400, "Fonte deve ser uma URL HTTPS ou rota do site");
  }
  return { id, title, answer, keywords: keywords.map(item => item.trim()), sourceUrl, active: value.active };
}

export async function saveKnowledgeArticle(input: unknown, expectedEtag: string | null): Promise<{ articles: KnowledgeArticle[]; etag: string | null }> {
  const article = validateArticle(input);
  const { articles, etag } = await readKnowledge(true);
  if (etag !== expectedEtag) throw new HttpError(409, "A base mudou em outra sessão. Atualize e tente novamente.");
  const next = [...articles.filter(item => item.id !== article.id), { ...article, updatedAt: new Date().toISOString() }]
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (next.length > MAX_ARTICLES) throw new HttpError(400, "Limite inicial de 200 artigos atingido");
  const body = new TextEncoder().encode(JSON.stringify({ version: 1, articles: next } satisfies KnowledgeFile));
  if (body.byteLength > MAX_BYTES) throw new HttpError(400, "Base excedeu 1 MB; reduza textos ou amplie o índice");
  const { client, bucket } = storage();
  try {
    const result = await client.send(new PutObjectCommand({
      Bucket: bucket, Key: KEY, Body: body, ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store", ...(etag ? { IfMatch: etag } : { IfNoneMatch: "*" }),
    }));
    const value = { articles: next, etag: result.ETag || null };
    cached = { value, until: Date.now() + 30_000 };
    return value;
  } catch (error) {
    const value = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (value?.name === "PreconditionFailed" || value?.$metadata?.httpStatusCode === 412) {
      throw new HttpError(409, "A base mudou em outra sessão. Atualize e tente novamente.");
    }
    throw new HttpError(503, "Não foi possível salvar na base de conhecimento");
  }
}
