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
import { siteFaq } from '../../supabase/functions/assistente-ia/site-faq';
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
            {siteFaq.map(({ question, answer, link }) => (
              <div key={question}>
                <h4 className="font-medium">{question}</h4>
                <p className="text-sm text-muted-foreground">{answer}</p>
                <a className="text-sm text-primary underline-offset-4 hover:underline" href={link.url}>{link.label}</a>
              </div>
            ))}
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
