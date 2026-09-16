import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Mic, Pencil, Send, Volume2, VolumeX, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Result = { id: string; name: string; description: string | null; address: string | null; profileUrl: string };
type AssistantLink = { label: string; url: string };
type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; results?: Result[]; links?: AssistantLink[] };
const allowedLinks = new Set(['/', '/locais', '/ferramentas']);
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export function AiAssistantChat() {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [editingTurnId, setEditingTurnId] = useState<number | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [error, setError] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const session = useRef<{ id: string; token: string } | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const turnId = useRef(0);
  const busyRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.functions.invoke('assistente-ia', { body: { action: 'status' } })
      .then(({ data, error: requestError }) => { if (active && !requestError) setAvailable(data?.enabled === true); });
    return () => {
      active = false;
      const currentRecognition = recognition.current;
      recognition.current = null;
      currentRecognition?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('sajtem:open-assistant', openAssistant);
    return () => window.removeEventListener('sajtem:open-assistant', openAssistant);
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

  async function sendMessage(message: string, replacingId: number | null = editingTurnId) {
    const trimmed = message.trim();
    if (!trimmed || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setInput('');
    setError('');
    setEditingTurnId(null);
    if (replacingId !== null) session.current = null;
    const userTurn = { id: ++turnId.current, role: 'user' as const, text: trimmed };
    setTurns(previous => replacingId === null ? [...previous, userTurn] : [userTurn]);
    try {
      const { data, error: requestError } = await supabase.functions.invoke('assistente-ia', {
        body: { action: 'chat', message: trimmed, sessionId: session.current?.id, sessionToken: session.current?.token },
      });
      if (requestError || !data?.text) {
        setError(data?.error || 'Não foi possível responder agora. Edite e reenvie sua pergunta.');
        return;
      }
      session.current = { id: data.sessionId, token: data.sessionToken };
      const answer = String(data.text);
      const links = Array.isArray(data.links)
        ? data.links.filter((link: AssistantLink) => allowedLinks.has(link?.url) && typeof link?.label === 'string')
        : [];
      setTurns(previous => [...previous, { id: ++turnId.current, role: 'assistant', text: answer, results: Array.isArray(data.results) ? data.results : [], links }]);
      speak(answer);
    } catch {
      setError('Não foi possível responder agora. Edite e reenvie sua pergunta.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
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
      instance.continuous = false;
      instance.interimResults = true;
      let finalText = '';
      let failed = false;
      instance.onresult = event => {
        const results = Array.from(event.results);
        finalText = results.filter(result => result.isFinal).map(result => result[0]?.transcript || '').join(' ').trim();
        const interimText = results.filter(result => !result.isFinal).map(result => result[0]?.transcript || '').join(' ').trim();
        setInput([finalText, interimText].filter(Boolean).join(' '));
      };
      instance.onerror = event => {
        failed = true;
        setError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Permita o microfone no navegador ou digite sua pergunta.'
          : 'Não foi possível concluir a escuta. Confira o texto e envie manualmente.');
      };
      instance.onend = () => {
        if (recognition.current !== instance) return;
        setListening(false);
        recognition.current = null;
        if (!failed && finalText) void sendMessage(finalText);
        else if (!failed) setError('Não entendi sua fala. Você pode tentar de novo ou digitar.');
      };
      instance.start();
      setListening(true);
      setError('');
    } catch {
      setError('Não foi possível iniciar o microfone. Você pode digitar.');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(input);
  }

  function closeChat() {
    const currentRecognition = recognition.current;
    recognition.current = null;
    currentRecognition?.abort();
    window.speechSynthesis?.cancel();
    setListening(false);
    setOpen(false);
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
        <Button variant="ghost" size="icon" aria-label="Fechar conversa" onClick={closeChat}><X className="h-4 w-4" /></Button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        {!turns.length && <p className="rounded-xl bg-muted p-3 text-sm">Olá! O que você procura? Experimente: “Quero encontrar uma pizzaria”. Você pode falar ou digitar.</p>}
        {turns.map(turn => <div key={turn.id} className={turn.role === 'user' ? 'ml-8 rounded-xl bg-primary p-3 text-sm text-primary-foreground' : 'mr-4 rounded-xl bg-muted p-3 text-sm'}>
          <p className="whitespace-pre-wrap break-words">{turn.text}</p>
          {turn.role === 'user' && !busy && <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2" onClick={() => { setInput(turn.text); setEditingTurnId(turn.id); setError(''); }}><Pencil className="h-3 w-3" /> Editar e reenviar</button>}
          {turn.results?.map(result => <div key={result.id} className="mt-2 rounded-lg border bg-card p-3 text-card-foreground">
            <p className="font-semibold">{result.name}</p>
            {result.description && <p className="mt-1 text-xs text-muted-foreground">{result.description}</p>}
            {result.address && <p className="mt-1 text-xs text-muted-foreground">{result.address}</p>}
            <Link to={result.profileUrl} onClick={() => trackProfile(result.id)} className="mt-2 inline-block font-medium text-primary underline">Abrir perfil</Link>
          </div>)}
          {turn.links?.map(link => <Link key={link.url} to={link.url} onClick={closeChat} className="mr-2 mt-2 inline-block rounded-lg border border-primary/30 bg-card px-3 py-2 font-medium text-primary underline underline-offset-2">{link.label}</Link>)}
        </div>)}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</p>}
      </div>
      {listening && <p role="status" className="flex items-center gap-2 px-3 pt-2 text-xs font-medium text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Ouvindo você… fale até terminar. A pergunta será enviada automaticamente.</p>}
      {editingTurnId !== null && <p role="status" className="px-3 pt-2 text-xs text-muted-foreground">Corrija a pergunta abaixo. Reenviar iniciará uma nova conversa com o texto corrigido.</p>}
      {error && <p role="alert" className="px-3 text-xs text-destructive">{error}</p>}
      <form onSubmit={event => void submit(event)} className="flex gap-2 border-t p-3">
        <Input aria-label="Sua pergunta" maxLength={500} placeholder={listening ? 'Ouvindo sua pergunta...' : 'O que você procura?'} value={input} onChange={event => setInput(event.target.value)} disabled={busy || listening} />
        <Button type="button" variant={listening ? 'default' : 'outline'} size="icon" aria-label={listening ? 'Parar e enviar fala' : 'Falar pergunta'} disabled={busy} onClick={() => listening ? recognition.current?.stop() : startListening()}><Mic className={listening ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} /></Button>
        <Button type="submit" size="icon" aria-label={editingTurnId !== null ? 'Reenviar pergunta corrigida' : 'Enviar pergunta'} disabled={busy || listening || !input.trim()}><Send className="h-4 w-4" /></Button>
      </form>
      <p className="px-3 pb-2 text-[11px] text-muted-foreground">Não envie dados sensíveis. Perguntas complexas podem usar IA; o microfone depende do navegador.</p>
    </section>}
    <Button className="ml-auto flex rounded-full px-5 shadow-lg" onClick={() => open ? closeChat() : setOpen(true)} aria-expanded={open} aria-label={open ? 'Fechar assistente de IA' : 'Abrir assistente de IA'}><Bot className="mr-2 h-5 w-5" /> Pergunte ao Saj Tem</Button>
  </div>;
}
