import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateShortUrlParams {
  original_url: string;
  expires_at?: string;
}

interface ShortUrlResponse {
  short_url: string;
  short_code: string;
  original_url: string;
  expires_at?: string;
  created_at: string;
}

export const useShortUrls = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createShortUrl = async (params: CreateShortUrlParams): Promise<ShortUrlResponse | null> => {
    setIsLoading(true);
    
    try {
      console.log('Criando URL curta para:', params.original_url);
      
      const { data, error } = await supabase.functions.invoke('create-short-url', {
        body: params
      });

      if (error) {
        console.error('Erro ao criar URL curta:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a URL curta",
          variant: "destructive"
        });
        return null;
      }

      console.log('URL curta criada:', data);
      
      toast({
        title: "Sucesso",
        description: "URL curta criada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar URL curta:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getShortUrl = (shortCode: string): string => {
    // Use the current app's domain, not the Supabase domain
    return `${window.location.origin}/${shortCode}`;
  };

  const copyToClipboard = async (url: string) => {
    try {
      // Check if clipboard API is available and document is focused
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Copiado!",
          description: "URL copiada para a área de transferência",
        });
      } else {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast({
            title: "Copiado!",
            description: "URL copiada para a área de transferência",
          });
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          toast({
            title: "URL gerada",
            description: url,
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
      toast({
        title: "URL gerada",
        description: url,
      });
    }
  };

  return {
    createShortUrl,
    getShortUrl,
    copyToClipboard,
    isLoading
  };
};