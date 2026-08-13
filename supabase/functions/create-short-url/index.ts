import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido')
    const { user, admin: supabaseClient } = await requireUser(req)

    const { original_url, expires_at } = await req.json()
    
    if (!original_url) {
      throw new HttpError(400, 'original_url é obrigatório')
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(original_url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol')
    } catch {
      throw new HttpError(400, 'URL inválida')
    }

    // Generate short code
    const { data: shortCodeData, error: shortCodeError } = await supabaseClient
      .rpc('generate_short_code')

    if (shortCodeError) {
      console.error('Erro ao gerar código curto:', shortCodeError)
      throw new HttpError(500, 'Erro interno do servidor')
    }

    // Create short URL
    const { data, error } = await supabaseClient
      .from('short_urls')
      .insert({
        short_code: shortCodeData,
        original_url,
        expires_at: expires_at || null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar URL curta:', error)
      throw new HttpError(500, 'Erro ao criar URL curta')
    }

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://sajtem.com').replace(/\/$/, '')
    const shortUrl = `${siteUrl}/${data.short_code}`;

    return jsonResponse(req, {
        short_url: shortUrl,
        short_code: data.short_code,
        original_url: data.original_url,
        expires_at: data.expires_at,
        created_at: data.created_at,
      })

  } catch (error) {
    return errorResponse(req, error)
  }
})
