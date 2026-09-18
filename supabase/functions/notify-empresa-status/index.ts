import { requireServiceRole, errorResponse, jsonResponse } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") return jsonResponse(req, { error: "Método não permitido" }, 405);
  try {
    requireServiceRole(req);
  } catch (error) {
    return errorResponse(req, error);
  }

  try {
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_EMPRESA_STATUS');

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_EMPRESA_STATUS não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { empresa_id, status, observacoes } = await req.json();

    console.log('Recebido request para notificar empresa:', { empresa_id, status });

    // Buscar dados da empresa e do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select(`
        id,
        nome,
        usuario_id,
        usuarios:usuario_id (
          nome,
          email,
          telefone
        )
      `)
      .eq('id', empresa_id)
      .single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa:', empresaError);
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!empresa.usuario_id || !empresa.usuarios) {
      console.log('Empresa sem proprietário definido, pulando notificação');
      return new Response(
        JSON.stringify({ message: 'Empresa sem proprietário' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usuarioData = empresa.usuarios as unknown as { nome: string; email: string; telefone: string | null };

    // Formatar telefone com código do país e gerar versões com/sem 9º dígito
    const formatarTelefone = (telefone: string | null) => {
      if (!telefone) return { com_9: '', sem_9: '' };

      // Remove tudo que não é número
      let limpo = telefone.replace(/\D/g, '');

      // Adiciona 55 se não tiver
      if (!limpo.startsWith('55')) {
        limpo = '55' + limpo;
      }

      // Extrai DDD e número
      const ddd = limpo.substring(2, 4);
      const numero = limpo.substring(4);

      // Verifica se tem 9 dígitos (com o 9) ou 8 dígitos (sem o 9)
      if (numero.length === 9 && numero.startsWith('9')) {
        // Tem o 9, gera versão sem
        return {
          com_9: limpo,
          sem_9: '55' + ddd + numero.substring(1)
        };
      } else if (numero.length === 8) {
        // Não tem o 9, gera versão com
        return {
          com_9: '55' + ddd + '9' + numero,
          sem_9: limpo
        };
      }

      // Retorna o que tiver
      return { com_9: limpo, sem_9: limpo };
    };

    const telefonesFormatados = formatarTelefone(usuarioData.telefone);

    // Preparar payload para o n8n
    const payload = {
      empresa_nome: empresa.nome,
      usuario_nome: usuarioData.nome || 'Cliente',
      usuario_email: usuarioData.email,
      usuario_telefone: telefonesFormatados.sem_9, // versão principal SEM o 9 extra
      usuario_telefone_com_9: telefonesFormatados.com_9, // versão alternativa COM o 9
      status: status, // 'aprovado' ou 'rejeitado'
      observacoes: observacoes || ''
    };

    // Enviar para o webhook do n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await n8nResponse.text();
    console.log('Resposta do n8n - Status:', n8nResponse.status);
    console.log('Resposta do n8n - Body:', responseText);

    if (!n8nResponse.ok) {
      console.error('Erro do n8n:', responseText);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar para n8n', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notificação enviada com sucesso para n8n');

    return new Response(
      JSON.stringify({ success: true, message: 'Notificação enviada' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na função notify-empresa-status:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
