import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  nome: string;
  tipo_conta?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, tipo_conta }: WelcomeEmailRequest = await req.json();

    const getWelcomeMessage = (tipo: string) => {
      switch (tipo) {
        case 'empresa':
          return {
            subject: "Bem-vindo ao Saj Tem - Sua empresa está no ar!",
            content: `
              <h1>Olá, ${nome}!</h1>
              <p>Parabéns! Sua empresa foi cadastrada no <strong>Saj Tem</strong>, o guia comercial de Santo Antônio de Jesus.</p>
              <p>Agora você pode:</p>
              <ul>
                <li>Gerenciar produtos e serviços</li>
                <li>Criar cupons promocionais</li>
                <li>Divulgar eventos</li>
                <li>Receber avaliações dos clientes</li>
              </ul>
              <p>Acesse sua conta e comece a aproveitar todos os recursos!</p>
              <p><strong>Equipe Saj Tem</strong></p>
            `
          };
        default:
          return {
            subject: "Bem-vindo ao Saj Tem!",
            content: `
              <h1>Olá, ${nome}!</h1>
              <p>Seja bem-vindo(a) ao <strong>Saj Tem</strong>, o guia comercial completo de Santo Antônio de Jesus!</p>
              <p>Explore locais, eventos, oportunidades de emprego e muito mais na sua cidade.</p>
              <p>Aproveite todos os recursos da plataforma!</p>
              <p><strong>Equipe Saj Tem</strong></p>
            `
          };
      }
    };

    const { subject, content } = getWelcomeMessage(tipo_conta || 'usuario');

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
            </div>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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