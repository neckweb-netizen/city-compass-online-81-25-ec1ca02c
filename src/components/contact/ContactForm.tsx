import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod/v3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailService } from '@/hooks/useEmailService';
import { Loader2, Mail, Phone, User, MessageSquare } from 'lucide-react';

const contactSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(254, 'Email muito longo'),
  telefone: z.string().trim().max(30, 'Telefone muito longo').optional(),
  assunto: z.string().trim().min(5, 'Assunto deve ter pelo menos 5 caracteres').max(150, 'Assunto muito longo'),
  mensagem: z.string().trim().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(5000, 'Mensagem muito longa'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
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
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmissionStatus(null);
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
      setSubmissionStatus('success');
    } catch (error) {
      console.warn('Falha ao enviar mensagem de contato.');
      setSubmissionStatus('error');
    } finally {
      submittingRef.current = false;
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isLoading} onChange={() => { if (submissionStatus) setSubmissionStatus(null); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome *
              </Label>
              <Input
                id="nome"
                autoComplete="name"
                maxLength={100}
                aria-invalid={Boolean(errors.nome)}
                aria-describedby={errors.nome ? 'erro-nome' : undefined}
                placeholder="Seu nome completo"
                {...register('nome')}
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p id="erro-nome" role="alert" className="text-sm text-destructive">{errors.nome.message}</p>
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
                autoComplete="email"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'erro-email' : undefined}
                placeholder="seu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p id="erro-email" role="alert" className="text-sm text-destructive">{errors.email.message}</p>
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
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={30}
                aria-invalid={Boolean(errors.telefone)}
                aria-describedby={errors.telefone ? 'erro-telefone' : undefined}
                placeholder="(75) 99999-9999"
                {...register('telefone')}
                className={errors.telefone ? 'border-destructive' : ''}
              />
              {errors.telefone && (
                <p id="erro-telefone" role="alert" className="text-sm text-destructive">{errors.telefone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                maxLength={150}
                aria-invalid={Boolean(errors.assunto)}
                aria-describedby={errors.assunto ? 'erro-assunto' : undefined}
                placeholder="Sobre o que você gostaria de falar?"
                {...register('assunto')}
                className={errors.assunto ? 'border-destructive' : ''}
              />
              {errors.assunto && (
                <p id="erro-assunto" role="alert" className="text-sm text-destructive">{errors.assunto.message}</p>
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
              maxLength={5000}
              aria-invalid={Boolean(errors.mensagem)}
              aria-describedby={errors.mensagem ? 'erro-mensagem' : undefined}
              placeholder="Descreva sua dúvida, sugestão ou solicitação..."
              rows={6}
              {...register('mensagem')}
              className={errors.mensagem ? 'border-destructive' : ''}
            />
            {errors.mensagem && (
              <p id="erro-mensagem" role="alert" className="text-sm text-destructive">{errors.mensagem.message}</p>
            )}
          </div>

          {submissionStatus === 'success' && (
            <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">Mensagem enviada com sucesso. Entraremos em contato em breve.</p>
          )}
          {submissionStatus === 'error' && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível enviar sua mensagem. Seus dados foram preservados para você tentar novamente.</p>
          )}

          <Button 
            type="submit" 
            className="w-full min-h-11" 
            aria-busy={isLoading}
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