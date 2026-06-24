import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email, telefone, assunto, mensagem }: ContactEmailRequest = await req.json();

    // Email para o usuário (confirmação)
    const userEmailResponse = await resend.emails.send({
      from: "Saj Tem <noreply@sajtem.com>",
      to: [email],
      subject: "Recebemos sua mensagem - Saj Tem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://uyleozhwzngnvyddfvni.supabase.co/storage/v1/object/public/lovable-uploads/e4435ab0-198f-4ab7-b4d2-83024c9490fc.png" alt="Saj Tem" style="height: 60px;">
            </div>
            <h1>Olá, ${nome}!</h1>
            <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Resumo da sua mensagem:</h3>
              <p><strong>Assunto:</strong> ${assunto}</p>
              <p><strong>Mensagem:</strong> ${mensagem}</p>
            </div>
            <p>Nossa equipe responderá sua solicitação o mais breve possível.</p>
            <p><strong>Equipe Saj Tem</strong></p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>WhatsApp para contato: (75) 99999-9999</p>
            </div>
          </div>
        </div>
      `,
    });

    // Email para administração (notificação)
    const adminEmailResponse = await resend.emails.send({
      from: "Saj Tem <noreply@sajtem.com>",
      to: ["admin@sajtem.com"], // Alterar para o email da administração
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

    console.log("Contact emails sent successfully:", { userEmailResponse, adminEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      userEmail: userEmailResponse,
      adminEmail: adminEmailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);