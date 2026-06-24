import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailService } from '@/hooks/useEmailService';
import { Loader2, Mail, Phone, User, MessageSquare } from 'lucide-react';

const contactSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  assunto: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres'),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { sendContactEmail } = useEmailService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      // Garantir que os campos obrigatórios estão presentes
      const emailData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        assunto: data.assunto,
        mensagem: data.mensagem,
      };
      await sendContactEmail(emailData);
      reset();
    } catch (error) {
      console.error('Erro ao enviar contato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Entre em Contato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome *
              </Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                {...register('nome')}
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (opcional)
              </Label>
              <Input
                id="telefone"
                placeholder="(75) 99999-9999"
                {...register('telefone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                placeholder="Sobre o que você gostaria de falar?"
                {...register('assunto')}
                className={errors.assunto ? 'border-destructive' : ''}
              />
              {errors.assunto && (
                <p className="text-sm text-destructive">{errors.assunto.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem *
            </Label>
            <Textarea
              id="mensagem"
              placeholder="Descreva sua dúvida, sugestão ou solicitação..."
              rows={6}
              {...register('mensagem')}
              className={errors.mensagem ? 'border-destructive' : ''}
            />
            {errors.mensagem && (
              <p className="text-sm text-destructive">{errors.mensagem.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};