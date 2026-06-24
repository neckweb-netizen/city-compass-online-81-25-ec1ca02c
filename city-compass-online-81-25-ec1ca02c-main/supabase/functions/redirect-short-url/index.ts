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
    const url = new URL(req.url)
    const shortCode = url.pathname.split('/').pop()
    
    if (!shortCode) {
      return new Response(
        'Código não encontrado',
        { status: 404 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get original URL and increment click count
    const { data, error } = await supabaseClient
      .from('short_urls')
      .select('original_url')
      .eq('short_code', shortCode)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar URL:', error)
      return new Response(
        'URL não encontrada ou expirada',
        { status: 404 }
      )
    }

    if (!data) {
      return new Response(
        'URL não encontrada ou expirada',
        { status: 404 }
      )
    }

    // Increment click count
    await supabaseClient
      .from('short_urls')
      .update({ clicks: supabaseClient.sql`clicks + 1` })
      .eq('short_code', shortCode)

    // Return original URL for redirect
    return new Response(
      JSON.stringify(data.original_url),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )


  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      'Erro interno do servidor',
      { status: 500 }
    )
  }
})