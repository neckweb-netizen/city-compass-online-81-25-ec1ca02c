import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planoId, userInfo } = await req.json();

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do plano
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single();

    if (planoError || !plano) {
      console.error('Erro ao buscar plano:', planoError);
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }), 
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar token do Mercado Pago das secrets
    const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    console.log('Token encontrado:', token ? 'SIM' : 'NÃO');
    console.log('Prefixo do token:', token ? token.substring(0, 10) + '...' : 'NENHUM');
    
    if (!token) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN não configurado nas secrets');
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado nas secrets do projeto' }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar pagamento Pix
    const idempotencyKey = crypto.randomUUID();
    
    const paymentData = {
      description: `Assinatura do plano ${plano.nome}`,
      transaction_amount: plano.preco_mensal,
      payment_method_id: "pix",
      payer: {
        email: userInfo.email,
        first_name: userInfo.nome.split(' ')[0],
        last_name: userInfo.nome.split(' ').slice(1).join(' ') || 'Silva',
        identification: {
          type: userInfo.tipoDocumento || "CPF",
          number: userInfo.documento || userInfo.cpf
        }
      }
    };

    console.log('Criando pagamento:', paymentData);

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
      console.error('Erro na API do Mercado Pago:', paymentResult);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pagamento', details: paymentResult }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Retornar dados do pagamento
    return new Response(
      JSON.stringify({
        id: paymentResult.id,
        status: paymentResult.status,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        transaction_amount: paymentResult.transaction_amount,
        description: paymentResult.description
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});