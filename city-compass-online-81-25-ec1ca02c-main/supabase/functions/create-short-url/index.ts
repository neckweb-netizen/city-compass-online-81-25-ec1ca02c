import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    
    // Set the session on the client
    await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', ''))

    const { original_url, expires_at } = await req.json()
    
    if (!original_url) {
      return new Response(
        JSON.stringify({ error: 'original_url é obrigatório' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate URL format
    try {
      new URL(original_url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'URL inválida' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Generate short code
    const { data: shortCodeData, error: shortCodeError } = await supabaseClient
      .rpc('generate_short_code')

    if (shortCodeError) {
      console.error('Erro ao gerar código curto:', shortCodeError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser()

    // Create short URL
    const { data, error } = await supabaseClient
      .from('short_urls')
      .insert({
        short_code: shortCodeData,
        original_url,
        expires_at: expires_at || null,
        created_by: user?.id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar URL curta:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar URL curta' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Use the original URL's origin to determine the correct domain
    const originalUrlObj = new URL(original_url);
    const shortUrl = `${originalUrlObj.origin}/${data.short_code}`;

    return new Response(
      JSON.stringify({ 
        short_url: shortUrl,
        short_code: data.short_code,
        original_url: data.original_url,
        expires_at: data.expires_at,
        created_at: data.created_at
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})