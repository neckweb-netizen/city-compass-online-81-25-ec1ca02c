import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ShortUrlRedirect() {
  const { shortCode } = useParams();

  useEffect(() => {
    const redirectToOriginalUrl = async () => {
      if (!shortCode) return;

      try {
        const { data, error } = await supabase.rpc('resolve_short_url', {
          p_short_code: shortCode,
        });

        if (error || !data) {
          console.error('URL não encontrada:', error);
          window.location.replace('/');
          return;
        }

        const destination = new URL(data, window.location.origin);
        if (!['http:', 'https:'].includes(destination.protocol)) {
          throw new Error('Destino inválido');
        }

        window.location.replace(destination.toString());
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        window.location.replace('/');
      }
    };

    redirectToOriginalUrl();
  }, [shortCode]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Abrindo o link...</p>
      </div>
    </div>
  );
}
