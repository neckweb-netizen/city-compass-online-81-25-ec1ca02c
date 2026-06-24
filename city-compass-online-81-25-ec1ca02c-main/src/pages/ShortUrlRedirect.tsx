import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ShortUrlRedirect() {
  const { shortCode } = useParams();

  useEffect(() => {
    const redirectToOriginalUrl = async () => {
      if (!shortCode) return;

      try {
        const { data, error } = await supabase
          .from('short_urls')
          .select('original_url')
          .eq('short_code', shortCode)
          .maybeSingle();

        if (error || !data) {
          console.error('URL não encontrada:', error);
          window.location.href = '/';
          return;
        }

        // Increment click count
        await supabase.rpc('increment_url_clicks', { code: shortCode });

        // Redirect to original URL
        window.location.href = data.original_url;
      } catch (error) {
        console.error('Erro ao redirecionar:', error);
        window.location.href = '/';
      }
    };

    redirectToOriginalUrl();
  }, [shortCode]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}