import { corsHeaders, jsonResponse } from '../_shared/security.ts'

// Retired: the previous implementation trusted limits and identifiers supplied by
// the caller, allowing anyone to bypass or exhaust another user's allowance.
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) })

  return jsonResponse(req, {
    error: 'Endpoint desativado. O limite deve ser aplicado no servidor que protege o recurso.',
  }, 410)
})
