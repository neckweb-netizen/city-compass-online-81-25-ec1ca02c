import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WelcomeEmailData {
  email: string;
  nome: string;
  tipo_conta?: string;
}

export interface EmpresaNotificationData {
  email: string;
  nome_usuario: string;
  nome_empresa: string;
  status: 'aprovado' | 'rejeitado';
  observacoes?: string;
}

export interface EventNotificationData {
  email: string;
  nome_usuario: string;
  titulo_evento: string;
  data_evento: string;
  local_evento: string;
  status: 'aprovado' | 'rejeitado';
  observacoes?: string;
}

export interface ContactEmailData {
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
}

export const useEmailService = () => {
  const sendWelcomeEmail = async (data: WelcomeEmailData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
        body: data,
      });

      if (error) throw error;

      toast.success('Email de boas-vindas enviado com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      toast.error('Erro ao enviar email de boas-vindas');
      throw error;
    }
  };

  const sendEmpresaNotification = async (data: EmpresaNotificationData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-empresa-notification', {
        body: data,
      });

      if (error) throw error;

      toast.success('Notificação enviada com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao enviar notificação de empresa:', error);
      toast.error('Erro ao enviar notificação');
      throw error;
    }
  };

  const sendEventNotification = async (data: EventNotificationData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-event-notification', {
        body: data,
      });

      if (error) throw error;

      toast.success('Notificação de evento enviada com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao enviar notificação de evento:', error);
      toast.error('Erro ao enviar notificação');
      throw error;
    }
  };

  const sendContactEmail = async (data: ContactEmailData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-contact-email', {
        body: data,
      });

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      return result;
    } catch (error: any) {
      console.error('Erro ao enviar email de contato:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      throw error;
    }
  };

  return {
    sendWelcomeEmail,
    sendEmpresaNotification,
    sendEventNotification,
    sendContactEmail,
  };
};