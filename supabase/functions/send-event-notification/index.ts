import { Resend } from "npm:resend@2.0.0";
import { escapeHtml, validateEmail } from "../_shared/email.ts";
import { corsHeaders as getCorsHeaders, errorResponse, HttpError, requireUser } from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EventNotificationRequest {
  email: string;
  nome_usuario: string;
  titulo_evento: string;
  data_evento: string;
  local_evento: string;
  status: 'aprovado' | 'rejeitado';
  observacoes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    await requireUser(req, ["admin_geral", "admin_cidade"]);
    const input: EventNotificationRequest = await req.json();
    const email = validateEmail(input.email);
    const nome_usuario = escapeHtml(input.nome_usuario, 100);
    const titulo_evento = escapeHtml(input.titulo_evento, 200);
    const data_evento = input.data_evento;
    const local_evento = escapeHtml(input.local_evento, 300);
    const status = input.status;
    const observacoes = escapeHtml(input.observacoes, 1000);
    if (!['aprovado', 'rejeitado'].includes(status)) throw new HttpError(400, 'Status inválido');

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getNotificationContent = (status: string) => {
      if (status === 'aprovado') {
        return {
          subject: `🎉 Evento "${titulo_evento}" aprovado!`,
          content: `
            <h1>Ótima notícia, ${nome_usuario}!</h1>
            <p>Seu evento <strong>"${titulo_evento}"</strong> foi aprovado e já está visível no Saj Tem!</p>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0ea5e9; margin-top: 0;">Detalhes do Evento:</h3>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${formatDate(data_evento)}</p>
              <p style="margin: 5px 0;"><strong>Local:</strong> ${local_evento}</p>
            </div>
            <p>Seu evento agora está sendo divulgado para toda a comunidade de Santo Antônio de Jesus!</p>
            <p>Compartilhe o link do evento nas suas redes sociais para aumentar a divulgação.</p>
          `
        };
      } else {
        return {
          subject: `❌ Evento "${titulo_evento}" - Revisão necessária`,
          content: `
            <h1>Olá, ${nome_usuario}</h1>
            <p>Seu evento <strong>"${titulo_evento}"</strong> precisa de algumas correções antes de ser aprovado.</p>
            ${observacoes ? `
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; margin-top: 0;">Observações:</h3>
                <p style="margin: 0;">${observacoes}</p>
              </div>
            ` : ''}
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Detalhes do Evento:</h4>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${formatDate(data_evento)}</p>
              <p style="margin: 5px 0;"><strong>Local:</strong> ${local_evento}</p>
            </div>
            <p>Faça as correções necessárias e reenvie seu evento para aprovação.</p>
          `
        };
      }
    };

    const { subject, content } = getNotificationContent(status);

    const emailResponse = await resend.emails.send({
      from: "Saj Tem <noreply@sajtem.com>",
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://uyleozhwzngnvyddfvni.supabase.co/storage/v1/object/public/lovable-uploads/e4435ab0-198f-4ab7-b4d2-83024c9490fc.png" alt="Saj Tem" style="height: 60px;">
            </div>
            ${content}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>Este é um email automático do sistema Saj Tem.</p>
              <p>Para suporte, entre em contato pelo WhatsApp (75) 99999-9999</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Event notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return errorResponse(req, error);
  }
};

Deno.serve(handler);
