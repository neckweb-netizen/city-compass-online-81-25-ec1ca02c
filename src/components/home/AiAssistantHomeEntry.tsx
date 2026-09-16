import { useEffect, useState } from 'react';
import { ArrowRight, Bot, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function AiAssistantHomeEntry() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.functions.invoke('assistente-ia', { body: { action: 'status' } })
      .then(({ data, error }) => { if (active && !error) setAvailable(data?.enabled === true); });
    return () => { active = false; };
  }, []);

  if (!available) return null;

  return (
    <section aria-labelledby="ai-assistant-home-title" className="mx-auto w-full max-w-7xl rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bot className="h-6 w-6" aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 id="ai-assistant-home-title" className="text-lg font-semibold">O que você procura em Saj Tem?</h2>
            <p className="text-sm text-muted-foreground">Converse ou fale com o assistente para encontrar empresas e serviços da cidade.</p>
          </div>
        </div>
        <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => window.dispatchEvent(new Event('sajtem:open-assistant'))}>
          <Mic className="mr-2 h-4 w-4" aria-hidden="true" /> Conversar com o assistente <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
