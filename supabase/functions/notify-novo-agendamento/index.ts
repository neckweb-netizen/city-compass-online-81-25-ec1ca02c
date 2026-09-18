import { requireServiceRole, errorResponse, jsonResponse } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Delay em milissegundos antes de enviar (evita mensagens em massa)
const NOTIFICATION_DELAY_MS = 20000; // 20 segundos

// Função para aguardar o delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_AGENDAMENTO');

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_AGENDAMENTO não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook de agendamento não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agendamento_id } = await req.json();

    console.log('Recebido request para notificar novo agendamento:', { agendamento_id });

    // Buscar dados do agendamento e da empresa
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', agendamento_id)
      .single();

    if (agendamentoError || !agendamento) {
      console.error('Erro ao buscar agendamento:', agendamentoError);
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar limite de notificações usando a função do banco
    const { data: limiteResult, error: limiteError } = await supabase
      .rpc('verificar_limite_notificacoes_whatsapp', {
        p_empresa_id: agendamento.empresa_id,
        p_tipo_notificacao: 'agendamento'
      });

    if (limiteError) {
      console.error('Erro ao verificar limite:', limiteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar limite de notificações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resultado verificação de limite:', limiteResult);

    if (!limiteResult.permitido) {
      console.log('Notificação não permitida:', limiteResult.motivo);
      return new Response(
        JSON.stringify({
          message: limiteResult.motivo,
          notificacao_enviada: false,
          limite: limiteResult.limite,
          usado: limiteResult.usado
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar empresa com dados do proprietário
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select(`
        id,
        nome,
        telefone,
        usuario_id,
        usuarios:usuario_id (
          nome,
          email,
          telefone
        )
      `)
      .eq('id', agendamento.empresa_id)
      .single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa:', empresaError);
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

// Função para limpar telefone (remover caracteres especiais)
    const limparTelefone = (tel: string | null): string | null => {
      if (!tel) return null;
      // Remove tudo que não for dígito
      return tel.replace(/\D/g, '');
    };

    // Pegar APENAS o telefone do usuário proprietário (NÃO usar telefone da empresa)
    const usuarioData = empresa.usuarios as unknown as { nome: string; email: string; telefone: string | null } | null;
    const telefoneDestino = limparTelefone(usuarioData?.telefone || null);

    if (!telefoneDestino) {
      console.log('Proprietário sem telefone cadastrado, pulando notificação');
      return new Response(
        JSON.stringify({ message: 'Proprietário sem telefone cadastrado', notificacao_enviada: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aplicar delay antes de enviar (evita mensagens em massa)
    console.log(`Aguardando ${NOTIFICATION_DELAY_MS / 1000} segundos antes de enviar notificação...`);
    await delay(NOTIFICATION_DELAY_MS);

    // Formatar data do agendamento
    const dataAgendamento = new Date(agendamento.data_agendamento);
    const dataFormatada = dataAgendamento.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Preparar payload para o n8n
    const payload = {
      empresa_nome: empresa.nome,
      empresa_telefone: telefoneDestino,
      proprietario_nome: usuarioData?.nome || 'Proprietário',
      cliente_nome: agendamento.nome_cliente,
      cliente_telefone: agendamento.telefone_cliente,
      servico: agendamento.servico,
      data_agendamento: dataFormatada,
      observacoes: agendamento.observacoes || '',
      plano_nome: limiteResult.plano_nome || 'N/A'
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

    const sucesso = n8nResponse.ok;

    // Registrar log da notificação
    const { error: logError } = await supabase
      .from('notificacoes_whatsapp_log')
      .insert({
        empresa_id: empresa.id,
        tipo_notificacao: 'agendamento',
        destinatario_telefone: telefoneDestino,
        payload: payload,
        sucesso: sucesso,
        erro_mensagem: sucesso ? null : responseText
      });

    if (logError) {
      console.error('Erro ao registrar log de notificação:', logError);
    }

    if (!sucesso) {
      console.error('Erro do n8n:', responseText);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar para n8n', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Notificação de agendamento enviada com sucesso para n8n');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificação enviada',
        notificacao_enviada: true,
        limite_info: limiteResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na função notify-novo-agendamento:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
