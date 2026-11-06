import { corsHeaders, errorResponse, enforceRateLimit, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

const ALLOWED_EVENTS = new Set(['user_creation', 'login_success', 'signup_success', 'logout', 'unauthorized_access']);

// Browser supplied security events are informational only, never proof of
// authentication success or an authorization decision. Avoid storing PII,
// credentials, tokens or arbitrary nested data from the untrusted browser.
function sanitizeSecurityMetadata(eventType: string, input: unknown): Record<string, string> {
  if (!ALLOWED_EVENTS.has(eventType)) throw new HttpError(400, 'Tipo de evento inválido');
  if (input === null || input === undefined) return {};
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Metadados inválidos');
  }

  const obj = input as Record<string, unknown>;
  const result: Record<string, string> = {};
  // No email, IP, auth token, name or user supplied free text is copied.
  for (const key of ['account_type']) {
    const value = obj[key];
    if (key === 'account_type' && typeof value === 'string' &&
      ['usuario', 'empresa', 'admin_cidade', 'admin_geral'].includes(value)) {
      result[key] = value;
    }
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    const { user, admin: supabase } = await requireUser(req);
    await enforceRateLimit(req, 'log-security-event', 20, 60_000, user.id);

    const declaredLength = Number(req.headers.get('content-length') || 0);
    if (!Number.isFinite(declaredLength) || declaredLength > 4096) {
      throw new HttpError(413, 'Evento de segurança muito grande');
    }
    const text = await req.text();
    if (text.length > 4096) throw new HttpError(413, 'Evento de segurança muito grande');

    let payload: unknown;
    try { payload = JSON.parse(text); }
    catch { throw new HttpError(400, 'JSON inválido'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new HttpError(400, 'Evento inválido');
    }
    const input = payload as Record<string, unknown>;
    const eventType = input.event_type;
    if (typeof eventType !== 'string' || !ALLOWED_EVENTS.has(eventType)) {
      throw new HttpError(400, 'Tipo de evento inválido');
    }
    const metadata = sanitizeSecurityMetadata(eventType, input.metadata);

    // Prefer the gateway's last forwarded address; cap length and do not
    // accept IP/user IDs supplied inside the JSON body.
    const forwarded = req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
    const clientIP = (req.headers.get('x-real-ip') || forwarded || 'unknown').slice(0, 80);
    const userAgent = (req.headers.get('user-agent') || 'unknown').slice(0, 200);

    const { error } = await supabase.from('security_logs').insert({
      event_type: eventType,
      user_id: user.id,
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: { ...metadata, origin: 'client_reported' },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to persist security event:', error.code);
      throw new HttpError(503, 'Não foi possível registrar o evento');
    }

    // Never print potentially sensitive request payloads to Edge logs.
    return jsonResponse(req, { success: true, logged: true });
  } catch (error) {
    return errorResponse(req, error);
  }
});
