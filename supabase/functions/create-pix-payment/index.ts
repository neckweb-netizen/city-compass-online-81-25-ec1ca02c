import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    enforceRateLimit(req, 'pix', 10, 10 * 60 * 1000);
    const { user, profile, admin: supabase } = await requireUser(req);
    const { planoId, userInfo } = await req.json();
    if (!planoId || typeof planoId !== 'string') throw new HttpError(400, 'Plano inválido');

    // Buscar dados do plano
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .eq('ativo', true)
      .single();

    if (planoError || !plano) {
      console.error('Erro ao buscar plano:', planoError);
      throw new HttpError(404, 'Plano não encontrado');
    }

    const amount = Number(plano.preco_mensal);
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Preço do plano inválido');

    // Buscar token do Mercado Pago das secrets
    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!token) {
      throw new HttpError(500, 'Serviço de pagamento indisponível');
    }

    // Criar pagamento Pix
    const idempotencyKey = crypto.randomUUID();
    
    const paymentData = {
      description: `Assinatura do plano ${plano.nome}`,
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: {
        email: user.email,
        first_name: (profile?.nome || user.user_metadata?.nome || 'Cliente').split(' ')[0],
        last_name: (profile?.nome || user.user_metadata?.nome || 'Cliente').split(' ').slice(1).join(' ') || 'Cliente',
        identification: {
          type: userInfo?.tipoDocumento === 'CNPJ' ? 'CNPJ' : 'CPF',
          number: String(userInfo?.documento || userInfo?.cpf || '').replace(/\D/g, '')
        }
      }
    };

    if (!paymentData.payer.identification.number) throw new HttpError(400, 'Documento obrigatório');

    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await mercadoPagoResponse.json();
    
    if (!mercadoPagoResponse.ok) {
      console.error('Erro na API do Mercado Pago:', paymentResult?.message || mercadoPagoResponse.status);
      throw new HttpError(502, 'Não foi possível criar o pagamento');
    }

    // Retornar dados do pagamento
    return jsonResponse(req, {
        id: paymentResult.id,
        status: paymentResult.status,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        transaction_amount: paymentResult.transaction_amount,
        description: paymentResult.description,
      });
  } catch (error) {
    return errorResponse(req, error);
  }
});
