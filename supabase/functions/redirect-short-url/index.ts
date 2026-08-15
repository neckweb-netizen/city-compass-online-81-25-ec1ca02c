import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'
import { corsHeaders, errorResponse, HttpError, jsonResponse } from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) })

  try {
    const url = new URL(req.url)
    const shortCode = url.pathname.split('/').filter(Boolean).pop()
    if (!shortCode || !/^[A-Za-z0-9_-]{3,32}$/.test(shortCode)) {
      throw new HttpError(404, 'URL não encontrada ou expirada')
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data, error } = await admin
      .from('short_urls')
      .select('original_url, expires_at')
      .eq('short_code', shortCode)
      .maybeSingle()

    if (error || !data || (data.expires_at && new Date(data.expires_at) <= new Date())) {
      throw new HttpError(404, 'URL não encontrada ou expirada')
    }

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://sajtem.vercel.app').replace(/\/$/, '')
    const parsed = new URL(data.original_url, siteUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new HttpError(400, 'Destino inválido')
    }

    const { error: clickError } = await admin.rpc('increment_url_clicks', { code: shortCode })
    if (clickError) console.error('Falha ao contabilizar clique:', clickError)

    return jsonResponse(req, { original_url: parsed.toString() })
  } catch (error) {
    return errorResponse(req, error)
  }
})
