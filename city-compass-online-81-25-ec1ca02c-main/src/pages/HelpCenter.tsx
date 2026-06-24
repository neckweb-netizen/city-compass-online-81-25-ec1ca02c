import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
export const HelpCenter = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    categoria: '',
    mensagem: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria o envio do formulário
    toast({
      title: "Mensagem enviada!",
      description: "Em breve entraremos em contato com você."
    });
    setFormData({
      nome: '',
      email: '',
      assunto: '',
      categoria: '',
      mensagem: ''
    });
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Central de Ajuda</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Como cadastrar meu local?</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse seu perfil e clique em "Cadastrar Local" na seção "Área do Local". Preencha todas as informações e aguarde a aprovação.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Como avaliar um local?</h4>
                <p className="text-sm text-muted-foreground">
                  Entre no perfil do local e clique no botão "Avaliar" para deixar sua avaliação com estrelas e comentários.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Como usar cupons de desconto?</h4>
                <p className="text-sm text-muted-foreground">
                  Visualize os cupons disponíveis na aba "Cupons", clique no cupom desejado e apresente o código no local participante.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Como favoritar locais?</h4>
                <p className="text-sm text-muted-foreground">
                  Clique no ícone de coração no perfil do local para adicioná-lo aos seus favoritos e acesse depois pelo seu perfil.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como buscar vagas de emprego?</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse a seção "Vagas" no menu para ver oportunidades disponíveis. Use os filtros por categoria para encontrar sua área.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como anunciar serviços autônomos?</h4>
                <p className="text-sm text-muted-foreground">
                  Na seção "Serviços", clique em "Anunciar Serviço" para cadastrar seus serviços profissionais e atrair clientes.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como acompanhar eventos da cidade?</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse a aba "Eventos" para ver todos os eventos programados na sua cidade com datas, locais e descrições.
                </p>
              </div>

              <div>
                <h4 className="font-medium">O que são as Stories?</h4>
                <p className="text-sm text-muted-foreground">
                  Stories são atualizações rápidas dos locais com promoções, novidades e conteúdos que ficam disponíveis por tempo limitado.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como encontrar lugares públicos?</h4>
                <p className="text-sm text-muted-foreground">
                  Use o botão "Aonde Ir" na página inicial para descobrir praças, parques e outros locais públicos da sua cidade.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como funciona o canal informativo?</h4>
                <p className="text-sm text-muted-foreground">
                  O canal informativo traz notícias e informações importantes sobre a cidade, sempre atualizadas pela administração local.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Posso usar o app offline?</h4>
                <p className="text-sm text-muted-foreground">
                  O app funciona melhor online, mas você pode instalar como PWA no seu celular para acesso mais rápido.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Como receber notificações?</h4>
                <p className="text-sm text-muted-foreground">
                  Permita notificações no seu navegador para receber alertas sobre novos cupons, eventos e oportunidades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Entre em Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={formData.nome} onChange={e => handleInputChange('nome', e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required />
                </div>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria} onValueChange={value => handleInputChange('categoria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duvida">Dúvida geral</SelectItem>
                    <SelectItem value="problema">Problema técnico</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="empresa">Questões sobre local</SelectItem>
                    <SelectItem value="conta">Problemas com conta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assunto">Assunto</Label>
                <Input id="assunto" value={formData.assunto} onChange={e => handleInputChange('assunto', e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea id="mensagem" value={formData.mensagem} onChange={e => handleInputChange('mensagem', e.target.value)} placeholder="Descreva sua dúvida ou problema..." className="min-h-[120px]" required />
              </div>

              <Button type="submit" className="w-full">
                Enviar Mensagem
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Outras formas de contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              <div className="text-center">
                <h4 className="font-medium">E-mail</h4>
                <p className="text-sm text-muted-foreground">contato@sajtem.com.br</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div className="text-center">
                <h4 className="font-medium">WhatsApp</h4>
                <p className="text-sm text-muted-foreground">(75) 98180-4008</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default HelpCenter;