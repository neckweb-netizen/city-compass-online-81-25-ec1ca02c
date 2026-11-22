import { Resend } from "npm:resend@2.0.0";
import { escapeHtml, validateEmail } from "../_shared/email.ts";
import { corsHeaders, enforceRateLimit, errorResponse, HttpError, jsonResponse } from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ContactEmailRequest {
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "Método não permitido");
    await enforceRateLimit(req, "contact", 5, 10 * 60 * 1000);
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 20_000) throw new HttpError(413, "Mensagem muito grande");
    const input: ContactEmailRequest = await req.json();
    if (!input || typeof input !== "object") throw new HttpError(400, "Dados de contato inválidos");
    const readText = (value: unknown, label: string, min: number, max: number): string => {
      if (typeof value !== "string") throw new HttpError(400, `${label} inválido`);
      const trimmed = value.trim();
      if (trimmed.length < min || trimmed.length > max) {
        throw new HttpError(400, `${label} deve conter entre ${min} e ${max} caracteres`);
      }
      return trimmed;
    };
    const nome = escapeHtml(readText(input.nome, "Nome", 2, 100), 500);
    const email = validateEmail(input.email);
    const telefone = input.telefone ? escapeHtml(readText(input.telefone, "Telefone", 1, 30), 150) : "";
    const assunto = escapeHtml(readText(input.assunto, "Assunto", 5, 150), 750);
    const mensagem = escapeHtml(readText(input.mensagem, "Mensagem", 10, 5000), 25000);
    if (!Deno.env.get("RESEND_API_KEY")) throw new HttpError(503, "Serviço de envio temporariamente indisponível");
    const contactEmail = Deno.env.get("CONTACT_EMAIL");
    if (!contactEmail) throw new HttpError(500, "Canal de contato não configurado");

    // Email para administração (notificação)
    const adminEmailResponse = await resend.emails.send({
      from: "Saj Tem <noreply@sajtem.com>",
      to: [contactEmail],
      reply_to: email,
      subject: `📧 Nova mensagem de contato - ${assunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Nova mensagem de contato</h1>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3>Dados do contato:</h3>
            <p><strong>Nome:</strong> ${nome}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ''}
            <p><strong>Assunto:</strong> ${assunto}</p>
            
            <h3>Mensagem:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #d1d5db;">
              ${mensagem.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="margin-top: 20px; color: #666;">
            Esta mensagem foi enviada através do formulário de contato do Saj Tem.
          </p>
        </div>
      `,
    });

    if (adminEmailResponse.error || !adminEmailResponse.data?.id) {
      console.error('Contact email provider did not confirm message:', adminEmailResponse.error?.name ?? 'missing_message_id');
      throw new HttpError(503, 'Não foi possível confirmar o envio da mensagem. Tente novamente.');
    }

    return jsonResponse(req, { success: true, id: adminEmailResponse.data.id });
  } catch (error) {
    return errorResponse(req, error);
  }
};

Deno.serve(handler);
