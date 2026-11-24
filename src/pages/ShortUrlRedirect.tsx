import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function ShortUrlRedirect() {
  const { shortCode } = useParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setErrorMessage('');

    const redirectToOriginalUrl = async () => {
      if (!shortCode || !/^[A-Za-z0-9_-]{3,32}$/.test(shortCode)) {
        if (active) setErrorMessage('Este link não possui um código válido.');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('resolve_short_url', {
          p_short_code: shortCode,
        });

        if (error) {
          if (active && ['P0002', 'PGRST116'].includes(error.code))
            setErrorMessage('Este link não foi encontrado ou expirou.');
          else throw error;
          return;
        }
        if (!data) {
          if (active) setErrorMessage('Este link não foi encontrado ou não está mais disponível.');
          return;
        }

        if (typeof data !== 'string' || !data.startsWith('/') || data.startsWith('//') || data.includes('\\')) {
          if (active) setErrorMessage('O destino deste link não é permitido.');
          return;
        }
        const destination = new URL(data, window.location.origin);
        if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== window.location.origin) {
          if (active) setErrorMessage('O destino deste link não é permitido.');
          return;
        }

        // Não redirecionar para outro encurtador: evita ciclos e cadeias de links.
        // Rejeitar também segmentos codificados para evitar redirecionamentos em cadeia.
        let decodedPath: string;
        try { decodedPath = decodeURIComponent(destination.pathname); }
        catch { if (active) setErrorMessage('O destino deste link não é permitido.'); return; }
        if (/^\/s(?:\/|$)/i.test(decodedPath) || /^\/s(?:\/|$)/i.test(destination.pathname)) {
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
  }, [shortCode, attempt]);

  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        {errorMessage ? (
          <div role="alert">
            <h1 className="text-xl font-bold">Não foi possível abrir o link</h1>
            <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
            <Button type="button" variant="outline" className="mt-4 min-h-11 w-full" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button>
            <Button asChild className="mt-3 min-h-11 w-full">
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
