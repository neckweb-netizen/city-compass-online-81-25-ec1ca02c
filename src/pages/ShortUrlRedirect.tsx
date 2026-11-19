import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function ShortUrlRedirect() {
  const { shortCode } = useParams();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setErrorMessage('');

    const redirectToOriginalUrl = async () => {
      if (!shortCode) {
        if (active) setErrorMessage('Este link não possui um código válido.');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('resolve_short_url', {
          p_short_code: shortCode,
        });

        if (error) throw error;
        if (!data) {
          if (active) setErrorMessage('Este link não foi encontrado ou não está mais disponível.');
          return;
        }

        const destination = new URL(data, window.location.origin);
        if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== window.location.origin) {
          if (active) setErrorMessage('O destino deste link não é permitido.');
          return;
        }

        if (active) window.location.replace(destination.toString());
      } catch {
        if (active) setErrorMessage('Não foi possível abrir este link. Verifique sua conexão e tente novamente.');
      }
    };

    void redirectToOriginalUrl();
    return () => { active = false; };
  }, [shortCode]);

  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        {errorMessage ? (
          <div role="alert">
            <h1 className="text-xl font-bold">Não foi possível abrir o link</h1>
            <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
            <Button asChild className="mt-6 min-h-11 w-full">
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        ) : (
          <div role="status" aria-live="polite">
            <div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Abrindo o link...</p>
          </div>
        )}
      </div>
    </main>
  );
}
