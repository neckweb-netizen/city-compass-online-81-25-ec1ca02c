import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.112.3";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://sajtem.com,https://www.sajtem.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(req: Request, namespace: string, limit: number, windowMs: number): void {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress = forwardedFor || req.headers.get("x-real-ip") || "unknown";
  const key = `${namespace}:${clientAddress}`;
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    current.count += 1;
    if (current.count > limit) throw new HttpError(429, "Muitas tentativas. Aguarde e tente novamente.");
  }

  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const isLocalDevelopment = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
  const allowedOrigin = origin && (configuredOrigins.includes(origin) || isLocalDevelopment)
    ? origin
    : configuredOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export interface AuthContext {
  user: User;
  profile: { id: string; tipo_conta: string; nome: string | null; email: string | null } | null;
  admin: ReturnType<typeof createClient>;
}

export async function requireUser(req: Request, allowedRoles?: string[]): Promise<AuthContext> {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Autenticação obrigatória");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new HttpError(500, "Configuração do servidor incompleta");
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
    throw new HttpError(401, "Sessão inválida ou expirada");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("usuarios")
    .select("id, tipo_conta, nome, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, "Não foi possível validar o perfil");
  }
  if (allowedRoles?.length && (!profile || !allowedRoles.includes(profile.tipo_conta))) {
    throw new HttpError(403, "Permissão insuficiente");
  }

  return { user, profile, admin };
}

export function errorResponse(req: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(req, { error: error.message }, error.status);
  }
  console.error("Edge Function error:", error);
  return jsonResponse(req, { error: "Erro interno do servidor" }, 500);
}
