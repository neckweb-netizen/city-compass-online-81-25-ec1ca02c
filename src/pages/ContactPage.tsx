import { ContactForm } from '@/components/contact/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, MessageSquare, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Entre em Contato</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tem alguma dúvida, sugestão ou precisa de ajuda? Envie sua mensagem
          pelo formulário e nossa equipe responderá quando possível.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-lg">Como falar com o Saj Tem</h3>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Formulário de contato</p>
                  <p className="text-sm text-muted-foreground">
                    Preencha os dados e descreva sua solicitação ao lado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Região atendida</p>
                  <p className="text-sm text-muted-foreground">Santo Antônio de Jesus, Bahia, Brasil</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Seus dados</p>
                  <p className="text-sm text-muted-foreground">
                    Informe apenas os dados necessários para retornarmos seu contato.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
