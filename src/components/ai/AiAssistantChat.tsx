import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Mic, Send, Volume2, VolumeX, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Result = { id: string; name: string; description: string | null; address: string | null; profileUrl: string };
type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; results?: Result[] };
type Recognition = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function AiAssistantChat() {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [error, setError] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const session = useRef<{ id: string; token: string } | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.functions.invoke('assistente-ia', { body: { action: 'status' } })
      .then(({ data, error: requestError }) => { if (active && !requestError) setAvailable(data?.enabled === true); });
    return () => {
      active = false;
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [turns, busy]);

  function speak(text: string) {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const browser = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) {
      setError('O microfone não é compatível com este navegador. Você pode digitar sua pergunta.');
      return;
    }
    try {
      const instance = new Constructor();
      recognition.current = instance;
      instance.lang = 'pt-BR';
      instance.onresult = event => setInput(event.results[0]?.[0]?.transcript || '');
      instance.onerror = () => setError('Não foi possível ouvir. Confira a permissão do microfone ou digite.');
      instance.onend = () => { setListening(false); recognition.current = null; };
      instance.start();
      setListening(true);
      setError('');
    } catch {
      setError('Não foi possível iniciar o microfone. Você pode digitar.');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setError('');
    setBusy(true);
    setTurns(previous => [...previous, { id: Date.now(), role: 'user', text: message }]);
    const { data, error: requestError } = await supabase.functions.invoke('assistente-ia', {
      body: { action: 'chat', message, sessionId: session.current?.id, sessionToken: session.current?.token },
    });
    setBusy(false);
    if (requestError || !data?.text) {
      setError(data?.error || 'Não foi possível responder agora. Tente novamente.');
      return;
    }
    session.current = { id: data.sessionId, token: data.sessionToken };
    const text = String(data.text);
    setTurns(previous => [...previous, { id: Date.now() + 1, role: 'assistant', text, results: Array.isArray(data.results) ? data.results : [] }]);
    speak(text);
  }

  function trackProfile(companyId: string) {
    if (!session.current) return;
    void supabase.functions.invoke('assistente-ia', {
      body: { action: 'track', eventType: 'profile', companyId, sessionId: session.current.id, sessionToken: session.current.token },
    });
    setOpen(false);
  }

  if (!available) return null;
  return <div className="fixed bottom-24 right-3 z-[70] sm:right-6 lg:bottom-6" aria-label="Assistente do Saj Tem">
    {open && <section className="mb-3 flex h-[min(70dvh,540px)] w-[min(calc(100vw-24px),420px)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl" aria-label="Conversa com o assistente">
      <header className="flex items-center gap-2 border-b p-3">
        <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1"><h2 className="font-semibold">Assistente Saj Tem</h2><p className="text-xs text-muted-foreground">Encontre locais e serviços da cidade</p></div>
        <Button variant="ghost" size="icon" aria-label={speechEnabled ? 'Desativar voz' : 'Ativar voz'} onClick={() => { window.speechSynthesis?.cancel(); setSpeechEnabled(!speechEnabled); }}>
          {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Fechar conversa" onClick={() => { window.speechSynthesis?.cancel(); setOpen(false); }}><X className="h-4 w-4" /></Button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        {!turns.length && <p className="rounded-xl bg-muted p-3 text-sm">Olá! O que você procura? Experimente: “Quero encontrar uma pizzaria”. Você pode falar ou digitar.</p>}
        {turns.map(turn => <div key={turn.id} className={turn.role === 'user' ? 'ml-8 rounded-xl bg-primary p-3 text-sm text-primary-foreground' : 'mr-4 rounded-xl bg-muted p-3 text-sm'}>
          <p>{turn.text}</p>
          {turn.results?.map(result => <div key={result.id} className="mt-2 rounded-lg border bg-card p-3 text-card-foreground">
            <p className="font-semibold">{result.name}</p>
            {result.description && <p className="mt-1 text-xs text-muted-foreground">{result.description}</p>}
            {result.address && <p className="mt-1 text-xs text-muted-foreground">{result.address}</p>}
            <Link to={result.profileUrl} onClick={() => trackProfile(result.id)} className="mt-2 inline-block font-medium text-primary underline">Abrir perfil</Link>
          </div>)}
        </div>)}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</p>}
      </div>
      {error && <p role="alert" className="px-3 text-xs text-destructive">{error}</p>}
      <form onSubmit={event => void submit(event)} className="flex gap-2 border-t p-3">
        <Input aria-label="Sua pergunta" maxLength={500} placeholder="O que você procura?" value={input} onChange={event => setInput(event.target.value)} disabled={busy} />
        <Button type="button" variant="outline" size="icon" aria-label={listening ? 'Parar microfone' : 'Falar pergunta'} onClick={() => listening ? recognition.current?.stop() : startListening()}><Mic className="h-4 w-4" /></Button>
        <Button type="submit" size="icon" aria-label="Enviar pergunta" disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
      </form>
      <p className="px-3 pb-2 text-[11px] text-muted-foreground">Não envie dados sensíveis. Perguntas complexas podem usar IA; o microfone depende do navegador.</p>
    </section>}
    <Button className="ml-auto flex rounded-full px-5 shadow-lg" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Abrir assistente de IA"><Bot className="mr-2 h-5 w-5" /> Pergunte ao Saj Tem</Button>
  </div>;
}
