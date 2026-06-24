
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  identifier: string;
  max_requests?: number;
  window_minutes?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { identifier, max_requests = 100, window_minutes = 60 }: RateLimitRequest = await req.json();
    
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const fullIdentifier = `${identifier}_${clientIP}`;
    
    const windowStart = new Date(Date.now() - window_minutes * 60 * 1000).toISOString();

    // Count requests in the current window
    const { count, error: countError } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', fullIdentifier)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('Error checking rate limit:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rate limit' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentCount = count || 0;
    const allowed = currentCount < max_requests;

    if (allowed) {
      // Log this request
      await supabase
        .from('rate_limit_logs')
        .insert({
          identifier: fullIdentifier,
          ip_address: clientIP,
          created_at: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify({ 
        allowed,
        current_count: currentCount,
        max_requests,
        reset_time: new Date(Date.now() - window_minutes * 60 * 1000 + window_minutes * 60 * 1000).toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
