import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    const { user, profile, admin: supabase } = await requireUser(req);
    await enforceRateLimit(req, 'pix', 10, 10 * 60 * 1000, user.id);
    const { planoId, userInfo, requestId } = await req.json();
    if (typeof requestId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new HttpError(400, 'Identificador da tentativa de pagamento inválido');
    }
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

    const documentType = userInfo?.tipoDocumento === 'CNPJ' ? 'CNPJ' : 'CPF';
    const documentNumber = String(userInfo?.documento || userInfo?.cpf || '').replace(/\D/g, '');
    if (!((documentType === 'CPF' && documentNumber.length === 11) ||
          (documentType === 'CNPJ' && documentNumber.length === 14))) {
      throw new HttpError(400, 'Documento CPF ou CNPJ inválido');
    }

    // Reserva persistente ANTES de contatar o provedor.
    // A chave é única por intenção e deve ser reutilizada ao repetir a mesma operação.
    const { error: reservationError } = await supabase.from('pix_payment_intents').insert({
      id: requestId,
      user_id: user.id,
      plano_id: plano.id,
      amount,
      status: 'creating',
    });

    if (reservationError) {
      if (reservationError.code !== '23505') {
        console.error('Falha ao reservar pagamento:', reservationError.code);
        throw new HttpError(503, 'Não foi possível iniciar o pagamento');
      }
      const { data: existing, error: lookupError } = await supabase
        .from('pix_payment_intents')
        .select('user_id, plano_id, amount, status, provider_response, updated_at')
        .eq('id', requestId)
        .single();
      if (lookupError || !existing) throw new HttpError(503, 'Falha ao consultar tentativa anterior');
      if (existing.user_id !== user.id || existing.plano_id !== plano.id || Number(existing.amount) !== amount) {
        throw new HttpError(409, 'Identificador já usado em outra compra');
      }
      if (existing.status === 'created' && existing.provider_response) {
        return jsonResponse(req, existing.provider_response);
      }
      if (existing.status !== 'creating') {
        throw new HttpError(409, 'Esta tentativa falhou. Inicie uma nova tentativa.');
      }
      // Recupera tentativas interrompidas utilizando a MESMA chave no Mercado Pago.
      // Somente uma invocação pode reclamar uma tentativa antiga, via UPDATE condicional.
      const cutoff = new Date(Date.now() - 120_000).toISOString();
      if (!existing.updated_at || existing.updated_at >= cutoff) {
        throw new HttpError(409, 'Pagamento em processamento. Consulte novamente em instantes.');
      }
      const { data: reclaimed, error: reclaimError } = await supabase
        .from('pix_payment_intents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'creating')
        .lt('updated_at', cutoff)
        .select('id')
        .maybeSingle();
      if (reclaimError || !reclaimed) {
        throw new HttpError(409, 'Pagamento em processamento. Consulte novamente em instantes.');
      }
    }
    const idempotencyKey = requestId;
    
    const paymentData = {
      description: `Assinatura do plano ${plano.nome}`,
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: {
        email: user.email,
        first_name: (profile?.nome || user.user_metadata?.nome || 'Cliente').split(' ')[0],
        last_name: (profile?.nome || user.user_metadata?.nome || 'Cliente').split(' ').slice(1).join(' ') || 'Cliente',
        identification: {
          type: documentType,
          number: documentNumber
        }
      }
    };

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
      await supabase.from('pix_payment_intents').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', requestId);
      throw new HttpError(502, 'Não foi possível criar o pagamento');
    }

    const responsePayload = {
      id: paymentResult.id,
      status: paymentResult.status,
      qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
      transaction_amount: paymentResult.transaction_amount,
      description: paymentResult.description,
    };
    if (!paymentResult.id) throw new HttpError(502, 'Provedor retornou pagamento inválido');
    const { error: persistError } = await supabase.from('pix_payment_intents').update({
      status: 'created',
      provider_payment_id: String(paymentResult.id),
      provider_response: responsePayload,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).eq('status', 'creating');
    if (persistError) {
      // Não cria outra cobrança: a chave de idempotência foi preservada no banco.
      console.error('Falha ao persistir pagamento:', persistError.code);
      throw new HttpError(503, 'Pagamento criado; confirmação temporariamente indisponível');
    }
    return jsonResponse(req, responsePayload);
  } catch (error) {
    return errorResponse(req, error);
  }
});
