
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_type, user_id, metadata, ip_address }: SecurityEvent = await req.json();

    // Get IP address from request if not provided
    const clientIP = ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log to security_logs table
    const { data, error } = await supabase
      .from('security_logs')
      .insert({
        event_type,
        user_id,
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging security event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log security event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Additional alerting for critical events
    const criticalEvents = ['login_failed', 'unauthorized_access', 'suspicious_activity'];
    if (criticalEvents.includes(event_type)) {
      console.log(`🚨 CRITICAL SECURITY EVENT: ${event_type}`, {
        user_id,
        ip_address: clientIP,
        metadata
      });
      
      // Here you could integrate with external monitoring services
      // like LogSnag, Sentry, or send notifications
    }

    return new Response(
      JSON.stringify({ success: true, logged: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Security logging error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
