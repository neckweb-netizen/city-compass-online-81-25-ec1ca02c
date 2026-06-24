import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre o tratamento de dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">1. Informações coletadas</h3>
            <p className="text-muted-foreground">
              Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone 
              e outras informações quando você se cadastra em nossa plataforma ou interage com nossos serviços.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">2. Como usamos suas informações</h3>
            <p className="text-muted-foreground">
              Utilizamos suas informações para fornecer e melhorar nossos serviços, processar 
              transações, comunicar com você e personalizar sua experiência na plataforma.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">3. Compartilhamento de informações</h3>
            <p className="text-muted-foreground">
              Não vendemos, negociamos ou transferimos suas informações pessoais para terceiros 
              sem seu consentimento, exceto quando necessário para fornecer nossos serviços ou 
              quando exigido por lei.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">4. Segurança</h3>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança apropriadas para proteger suas informações 
              pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">5. Seus direitos</h3>
            <p className="text-muted-foreground">
              Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. 
              Entre em contato conosco se desejar exercer esses direitos.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">6. Contato</h3>
            <p className="text-muted-foreground">
              Se você tiver dúvidas sobre esta política de privacidade, entre em contato 
              conosco através dos canais disponibilizados na plataforma.
            </p>
          </section>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Esta política foi atualizada pela última vez em {new Date().toLocaleDateString('pt-BR')}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;