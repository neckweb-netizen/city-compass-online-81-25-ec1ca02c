import { requireServiceRole, errorResponse, jsonResponse } from "../_shared/security.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") return jsonResponse(req, { error: "Método não permitido" }, 405);
  try {
    requireServiceRole(req);
  } catch (error) {
    return errorResponse(req, error);
  }

  try {
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_PLANO_VENCENDO");

    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_PLANO_VENCENDO não configurado");
      return new Response(
        JSON.stringify({ error: "Webhook não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar empresas com plano vencendo nos próximos 7 dias ou já vencidos
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);

    console.log("Buscando empresas com planos vencendo...");

    const { data: empresas, error: empresasError } = await supabase
      .from("empresas")
      .select(`
        id,
        nome,
        plano_data_vencimento,
        usuario_id,
        plano_atual_id,
        planos:plano_atual_id (
          nome
        ),
        usuarios:usuario_id (
          nome,
          telefone
        )
      `)
      .not("plano_atual_id", "is", null)
      .not("usuario_id", "is", null)
      .lte("plano_data_vencimento", em7Dias.toISOString())
      .order("plano_data_vencimento", { ascending: true });

    if (empresasError) {
      console.error("Erro ao buscar empresas:", empresasError);
      throw empresasError;
    }

    console.log(`Encontradas ${empresas?.length || 0} empresas com planos vencendo`);

    if (!empresas || empresas.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma empresa com plano vencendo" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Função para limpar telefone
    const limparTelefone = (telefone: string | null): string => {
      if (!telefone) return "";
      return telefone.replace(/[\s\-\(\)\.]/g, "");
    };

    // Calcular dias restantes
    const calcularDiasRestantes = (dataVencimento: string): number => {
      const vencimento = new Date(dataVencimento);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // Formatar data para exibição
    const formatarData = (dataString: string): string => {
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };

    const resultados = [];

    for (const empresa of empresas) {
      const usuario = empresa.usuarios as any;
      const plano = empresa.planos as any;

      if (!usuario?.telefone) {
        console.log(`Empresa ${empresa.nome}: proprietário sem telefone, pulando...`);
        continue;
      }

      const telefoneDestino = limparTelefone(usuario.telefone);
      if (!telefoneDestino) {
        console.log(`Empresa ${empresa.nome}: telefone inválido, pulando...`);
        continue;
      }

      const diasRestantes = calcularDiasRestantes(empresa.plano_data_vencimento);
      const dataVencimentoFormatada = formatarData(empresa.plano_data_vencimento);

      const payload = {
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
        empresa_telefone: telefoneDestino,
        plano_nome: plano?.nome || "Plano",
        dias_restantes: diasRestantes,
        data_vencimento: dataVencimentoFormatada,
        usuario_nome: usuario.nome || "Proprietário",
        tipo_alerta: diasRestantes <= 0 ? "vencido" : diasRestantes <= 3 ? "urgente" : "aviso"
      };


      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log(`Resposta n8n para ${empresa.nome}: ${n8nResponse.status}`);

        resultados.push({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          sucesso: n8nResponse.ok,
          status: n8nResponse.status
        });
      } catch (webhookError: any) {
        console.error(`Erro ao enviar webhook para ${empresa.nome}:`, webhookError);
        resultados.push({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          sucesso: false,
          erro: webhookError.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processadas ${resultados.length} empresas`,
        resultados
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro no notify-plano-vencendo:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
