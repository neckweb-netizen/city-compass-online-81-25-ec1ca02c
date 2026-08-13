import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse } from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) })

  try {
    enforceRateLimit(req, 'weather', 60, 60 * 1000)
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY')
    if (!apiKey) throw new HttpError(503, 'Serviço de clima não configurado')

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=-12.9674&lon=-39.2609&appid=${apiKey}&units=metric&lang=pt_br`,
    )
    if (!response.ok) throw new HttpError(502, 'Não foi possível consultar o clima')

    const data = await response.json()
    return jsonResponse(req, {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
    })
  } catch (error) {
    return errorResponse(req, error)
  }
})
