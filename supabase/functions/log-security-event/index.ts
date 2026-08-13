
import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

interface SecurityEvent {
  event_type: string;
  metadata?: any;
}

const ALLOWED_EVENTS = new Set(['user_creation', 'login_success', 'signup_success', 'logout', 'unauthorized_access']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    const { user, admin: supabase } = await requireUser(req);
    const { event_type, metadata }: SecurityEvent = await req.json();
    if (!ALLOWED_EVENTS.has(event_type)) throw new HttpError(400, 'Tipo de evento inválido');
    if (JSON.stringify(metadata ?? {}).length > 4000) throw new HttpError(400, 'Metadados muito grandes');

    // Nunca confiar em identidade ou IP enviados pelo navegador.
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log to security_logs table
    const { data, error } = await supabase
      .from('security_logs')
      .insert({
        event_type,
        user_id: user.id,
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging security event:', error);
      throw new HttpError(500, 'Não foi possível registrar o evento');
    }

    // Additional alerting for critical events
    const criticalEvents = ['unauthorized_access'];
    if (criticalEvents.includes(event_type)) {
      console.log(`🚨 CRITICAL SECURITY EVENT: ${event_type}`, {
        user_id: user.id,
        ip_address: clientIP,
        metadata
      });
      
      // Here you could integrate with external monitoring services
      // like LogSnag, Sentry, or send notifications
    }

    return jsonResponse(req, { success: true, logged: true });

  } catch (error) {
    return errorResponse(req, error);
  }
});
