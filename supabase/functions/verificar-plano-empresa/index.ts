import { requireUser, enforceRateLimit, errorResponse, HttpError } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificacaoRequest {
  empresa_id: string;
  tipo_verificacao: 'anuncio' | 'cupom' | 'evento';
  action: 'check' | 'increment';
}

interface PlanoLimites {
  limite_anuncios: number;
  limite_cupons: number;
  acesso_eventos: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { user, profile } = await requireUser(req);
    await enforceRateLimit(req, "verificar-plano-empresa", 30, 60_000, user.id);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { empresa_id, tipo_verificacao, action }: VerificacaoRequest = await req.json();

    if (!/^[0-9a-f-]{36}$/i.test(empresa_id ?? '')) throw new HttpError(400, 'Identificador inválido');

    console.log('Verificando plano da empresa:', {
      empresa_id,
      tipo_verificacao,
      action
    });

    // Buscar dados da empresa e seu plano
    let companyQuery = supabaseClient.from('empresas')
      .select(`
        id,
        nome,
        plano_atual_id,
        planos!inner(
          limite_anuncios,
          limite_cupons,
          acesso_eventos,
          nome
        )
      `)
      .eq('id', empresa_id);
    if (profile?.tipo_conta === 'admin_cidade') {
      if (!profile.cidade_id) throw new HttpError(403, 'Permissão insuficiente');
      companyQuery = companyQuery.eq('cidade_id', profile.cidade_id);
    } else if (profile?.tipo_conta !== 'admin_geral') {
      companyQuery = companyQuery.eq('usuario_id', user.id);
    }
    const { data: empresa, error: empresaError } = await companyQuery.single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa:', empresaError);
      throw new Error('Empresa não encontrada');
    }

    const plano = empresa.planos as PlanoLimites & { nome: string };

    // Verificar limites baseado no tipo
    let currentCount = 0;
    let limite = 0;
    let permitido = true;
    let mensagem = '';

    switch (tipo_verificacao) {
      case 'anuncio':
        // Contar anúncios ativos da empresa
        const { count: anunciosCount } = await supabaseClient
          .from('empresas')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', empresa.id)
          .eq('ativo', true);

        currentCount = anunciosCount || 0;
        limite = plano.limite_anuncios;

        if (limite !== -1 && currentCount >= limite) {
          permitido = false;
          mensagem = `Limite de anúncios atingido. Seu plano ${plano.nome} permite ${limite} anúncio(s).`;
        }
        break;

      case 'cupom':
        // Contar cupons ativos da empresa
        const { count: cuponsCount } = await supabaseClient
          .from('cupons')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa_id)
          .eq('ativo', true)
          .gt('data_fim', new Date().toISOString());

        currentCount = cuponsCount || 0;
        limite = plano.limite_cupons;

        if (limite !== -1 && currentCount >= limite) {
          permitido = false;
          mensagem = `Limite de cupons atingido. Seu plano ${plano.nome} permite ${limite} cupom(s).`;
        }
        break;

      case 'evento':
        if (!plano.acesso_eventos) {
          permitido = false;
          mensagem = `Seu plano ${plano.nome} não permite criação de eventos. Faça upgrade para acessar este recurso.`;
        }
        break;

      default:
        throw new Error('Tipo de verificação inválido');
    }

    const resultado = {
      permitido,
      currentCount,
      limite: limite === -1 ? 'Ilimitado' : limite,
      plano_nome: plano.nome,
      mensagem,
      empresa_nome: empresa.nome,
      tipo_verificacao
    };

    console.log('Resultado da verificação:', resultado);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    if (error instanceof HttpError) return errorResponse(req, error);
    console.error("Erro na função verificar-plano-empresa:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        permitido: false,
        mensagem: 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
};

serve(handler);
