import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Mic, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function AiAssistantHomeEntry() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.functions.invoke('assistente-ia', { body: { action: 'status' } })
      .then(({ data, error }) => {
        if (active) setAvailable(!error && data?.enabled === true);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => { active = false; };
  }, []);

  // O espaço permanece estável enquanto a disponibilidade da IA é consultada.
  // Se indisponível, oferecemos a pesquisa existente em vez de inserir/remover
  // um card acima de todas as seções, o que causava deslocamento de layout.
  const handleAction = () => {
    if (available) {
      window.dispatchEvent(new Event('sajtem:open-assistant'));
    } else {
      navigate('/busca');
    }
  };

  return (
    <section
      aria-labelledby="ai-assistant-home-title"
      className="mx-auto flex min-h-[168px] w-full max-w-7xl items-center rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:min-h-[112px] sm:p-6"
    >
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="ai-assistant-home-title" className="text-lg font-semibold">O que você procura em Saj Tem?</h2>
            <p className="text-sm text-muted-foreground">
              {available
                ? 'Converse ou fale com o assistente para encontrar empresas e serviços da cidade.'
                : 'Encontre empresas, produtos e serviços de Santo Antônio de Jesus.'}
            </p>
          </div>
        </div>
        <Button type="button" className="min-h-11 w-full shrink-0 sm:w-auto" onClick={handleAction}>
          {available ? <Mic className="mr-1 h-4 w-4" aria-hidden="true" /> : <Search className="mr-1 h-4 w-4" aria-hidden="true" />}
          {available ? 'Conversar com o assistente' : 'Buscar agora'}
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
