import { ContactForm } from '@/components/contact/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const ContactPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Entre em Contato</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tem alguma dúvida, sugestão ou precisa de ajuda? Entre em contato conosco 
          e nossa equipe retornará o mais breve possível.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Contato */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

        {/* Informações de Contato */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Informações de Contato</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">
                      Santo Antônio de Jesus<br />
                      Bahia, Brasil
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      (75) 99999-9999
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      contato@sajtem.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Horário de Atendimento</p>
                    <p className="text-sm text-muted-foreground">
                      Segunda a Sexta: 8h às 18h<br />
                      Sábado: 8h às 12h
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Outros Canais</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Redes Sociais</p>
                  <p className="text-sm text-muted-foreground">
                    Nos siga nas redes sociais para ficar por dentro das novidades
                  </p>
                </div>
                
                <div>
                  <p className="font-medium">Central de Ajuda</p>
                  <p className="text-sm text-muted-foreground">
                    Consulte nossa seção de perguntas frequentes
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