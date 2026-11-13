import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Mic, Pencil, Send, Volume2, VolumeX, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Result = {
  id: string;
  kind?: 'company' | 'product' | 'coupon' | 'event' | 'job' | 'service' | 'booking' | 'tool';
  name: string;
  description: string | null;
  address: string | null;
  profileUrl: string;
  actionLabel?: string;
  companyId?: string;
  distanceKm?: number | null;
};
type AssistantLink = { label: string; url: string };
type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; results?: Result[]; links?: AssistantLink[] };
const allowedLinkPrefixes = ['/', '/locais', '/ferramentas', '/eventos', '/oportunidades', '/viver-saj'];
const resultKindLabels: Record<NonNullable<Result['kind']>, string> = {
  company: 'Empresa', product: 'Produto', coupon: 'Cupom', event: 'Evento', job: 'Vaga',
  service: 'Serviço', booking: 'Agendamento', tool: 'Ferramenta',
};
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


// The assistant stays clear of the bottom navigation on phones, even after dragging.
const POSITION_KEY = 'sajtem:ai-button-position:v1';
const BUTTON_SIZE = 56;
type Point = { x: number; y: number };

function constrainPosition(point: Point): Point {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minTop = Math.min(76, Math.max(12, height - BUTTON_SIZE - 12));
  const maxTop = Math.max(minTop, height - BUTTON_SIZE - (width < 1024 ? 112 : 20));
  return {
    x: Math.max(12, Math.min(point.x, Math.max(12, width - BUTTON_SIZE - 12))),
    y: Math.max(minTop, Math.min(point.y, maxTop)),
  };
}

function initialPosition(): Point {
  if (typeof window === 'undefined') return { x: 20, y: 100 };
  const fallback = {
    x: window.innerWidth - BUTTON_SIZE - 16,
    y: window.innerHeight - BUTTON_SIZE - (window.innerWidth < 1024 ? 124 : 24),
  };
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (
        saved && typeof saved === 'object' && 'x' in saved && 'y' in saved &&
        typeof saved.x === 'number' && Number.isFinite(saved.x) &&
        typeof saved.y === 'number' && Number.isFinite(saved.y)
      ) return constrainPosition(saved as Point);
    }
  } catch {
    // Privacy settings may block storage. Dragging still works for this visit.
  }
  return constrainPosition(fallback);
}

export function AiAssistantChat({ initialOpen = false }: { initialOpen?: boolean }) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(initialOpen);
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
  const [position, setPosition] = useState<Point>(initialPosition);
  const positionRef = useRef(position);
  const dragRef = useRef<{
    pointerId: number; startX: number; startY: number; from: Point; moved: boolean;
  } | null>(null);
  const ignoreClickRef = useRef(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 390 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }));

  function updatePosition(next: Point, save = false) {
    const clamped = constrainPosition(next);
    positionRef.current = clamped;
    setPosition(clamped);
    if (save) {
      try { window.localStorage.setItem(POSITION_KEY, JSON.stringify(clamped)); } catch {
        // Keep the chosen position for this session if storage is unavailable.
      }
    }
  }

  useEffect(() => {
    const resize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const clamped = constrainPosition(positionRef.current);
      positionRef.current = clamped;
      setPosition(clamped);
    };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      from: positionRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (drag.moved) updatePosition({ x: drag.from.x + dx, y: drag.from.y + dy });
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.moved) {
      ignoreClickRef.current = true;
      updatePosition(positionRef.current, true);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function moveWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    const offsets: Record<string, Point> = {
      ArrowLeft: { x: -24, y: 0 }, ArrowRight: { x: 24, y: 0 },
      ArrowUp: { x: 0, y: -24 }, ArrowDown: { x: 0, y: 24 },
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    updatePosition({ x: positionRef.current.x + offset.x, y: positionRef.current.y + offset.y }, true);
  }

  // Keep the chat wholly inside the viewport and near the draggable launcher.
  const panelWidth = Math.min(420, Math.max(240, viewport.width - 24));
  const panelHeight = Math.min(540, Math.max(180, Math.floor(viewport.height * 0.65)));
  const panelLeft = Math.min(
    Math.max(12, position.x + BUTTON_SIZE - panelWidth),
    Math.max(12, viewport.width - panelWidth - 12),
  );
  const above = position.y - panelHeight - 12;
  const below = position.y + BUTTON_SIZE + 12;
  const panelTop = above >= 12
    ? above
    : below + panelHeight <= viewport.height - 12
      ? below
      : Math.max(12, Math.min(position.y - panelHeight - 12, viewport.height - panelHeight - 12));


  useEffect(() => {
    let active = true;
    const checkAvailability = () => {
      void supabase.functions.invoke('assistente-ia', { body: { action: 'status' } })
        .then(({ data, error: requestError }) => {
          if (!active) return;
          setAvailable(!requestError && data?.enabled === true);
          if (requestError || data?.enabled !== true) setOpen(false);
        });
    };
    checkAvailability();
    const timer = window.setInterval(checkAvailability, 60000);
    window.addEventListener('focus', checkAvailability);
    window.addEventListener('sajtem:ai-availability-changed', checkAvailability);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', checkAvailability);
      window.removeEventListener('sajtem:ai-availability-changed', checkAvailability);
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

  function isAllowedInternalUrl(value: unknown): value is string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return false;
    return allowedLinkPrefixes.some(prefix => value === prefix || (prefix !== '/' && value.startsWith(`${prefix}/`)));
  }

  async function optionalLocation(message: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!/\b(perto de mim|pr[oó]xim[oa] de mim|mais perto|mais pr[oó]xim[oa])\b/i.test(message) || !navigator.geolocation) return null;
    return await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
      );
    });
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
      const location = await optionalLocation(trimmed);
      const { data, error: requestError } = await supabase.functions.invoke('assistente-ia', {
        body: { action: 'chat', message: trimmed, sessionId: session.current?.id, sessionToken: session.current?.token, location },
      });
      if (requestError || !data?.text) {
        setError(data?.error || 'Não foi possível responder agora. Edite e reenvie sua pergunta.');
        return;
      }
      session.current = { id: data.sessionId, token: data.sessionToken };
      const answer = String(data.text);
      const links = Array.isArray(data.links)
        ? data.links.filter((link: AssistantLink) => isAllowedInternalUrl(link?.url) && typeof link?.label === 'string')
        : [];
      const results = Array.isArray(data.results)
        ? data.results.filter((result: Result) => result && typeof result.id === 'string' && typeof result.name === 'string' && isAllowedInternalUrl(result.profileUrl))
        : [];
      setTurns(previous => [...previous, { id: ++turnId.current, role: 'assistant', text: answer, results, links }]);
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

  function trackResult(result: Result) {
    if (!session.current || !result.companyId) {
      setOpen(false);
      return;
    }
    void supabase.functions.invoke('assistente-ia', {
      body: { action: 'track', eventType: 'profile', companyId: result.companyId, sessionId: session.current.id, sessionToken: session.current.token },
    });
    setOpen(false);
  }

  if (!available) return null;
  return <div aria-label="Assistente do Saj Tem">
    {open && <section
      style={{ position: 'fixed', left: panelLeft, top: panelTop, width: panelWidth, height: panelHeight }}
      className="z-[71] flex max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-2xl border border-primary/15 bg-card text-card-foreground shadow-2xl"
      aria-label="Conversa com o assistente"
    >
      <header className="flex items-center gap-2 border-b p-3">
        <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1"><h2 className="font-semibold">Assistente Saj Tem</h2><p className="text-xs text-muted-foreground">Converse ou faça uma busca local</p></div>
        <Button variant="ghost" size="icon" aria-label={speechEnabled ? 'Desativar voz' : 'Ativar voz'} onClick={() => { window.speechSynthesis?.cancel(); setSpeechEnabled(!speechEnabled); }}>
          {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Fechar conversa" onClick={closeChat}><X className="h-4 w-4" /></Button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        {!turns.length && <p className="rounded-xl bg-muted p-3 text-sm">Olá! Pode conversar comigo normalmente. Eu respondo perguntas sobre o Saj Tem e só mostro empresas quando você pedir uma busca local.</p>}
        {turns.map(turn => <div key={turn.id} className={turn.role === 'user' ? 'ml-8 rounded-xl bg-primary p-3 text-sm text-primary-foreground' : 'mr-4 rounded-xl bg-muted p-3 text-sm'}>
          <p className="whitespace-pre-wrap break-words">{turn.text}</p>
          {turn.role === 'user' && !busy && <button type="button" className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary underline-offset-2 hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => { setInput(turn.text); setEditingTurnId(turn.id); setError(''); }}><Pencil className="h-3 w-3" /> Editar e reenviar</button>}
          {turn.results?.map(result => <div key={result.id} className="mt-2 rounded-lg border bg-card p-3 text-card-foreground">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{result.name}</p>
              {result.kind && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{resultKindLabels[result.kind]}</span>}
            </div>
            {result.description && <p className="mt-1 text-xs text-muted-foreground">{result.description}</p>}
            {result.address && <p className="mt-1 text-xs text-muted-foreground">{result.address}</p>}
            {typeof result.distanceKm === 'number' && <p className="mt-1 text-xs font-medium text-primary">A aproximadamente {result.distanceKm.toFixed(1).replace('.', ',')} km</p>}
            <Link to={result.profileUrl} onClick={() => trackResult(result)} className="mt-2 inline-block font-medium text-primary underline">{result.actionLabel || 'Ver detalhes'}</Link>
          </div>)}
          {turn.links?.map(link => <Link key={link.url} to={link.url} onClick={closeChat} className="mr-2 mt-2 inline-block rounded-lg border border-primary/30 bg-card px-3 py-2 font-medium text-primary underline underline-offset-2">{link.label}</Link>)}
        </div>)}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Respondendo...</p>}
      </div>
      {listening && <p role="status" className="flex items-center gap-2 px-3 pt-2 text-xs font-medium text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Ouvindo você… fale até terminar. A pergunta será enviada automaticamente.</p>}
      {editingTurnId !== null && <p role="status" className="px-3 pt-2 text-xs text-muted-foreground">Corrija a pergunta abaixo. Reenviar iniciará uma nova conversa com o texto corrigido.</p>}
      {error && <p role="alert" className="px-3 text-xs text-destructive">{error}</p>}
      <form onSubmit={event => void submit(event)} className="flex gap-2 border-t p-3">
        <Input aria-label="Sua pergunta" maxLength={500} placeholder={listening ? 'Ouvindo sua pergunta...' : 'O que você quer saber?'} value={input} onChange={event => setInput(event.target.value)} disabled={busy || listening} />
        <Button type="button" variant={listening ? 'default' : 'outline'} size="icon" aria-label={listening ? 'Parar e enviar fala' : 'Falar pergunta'} disabled={busy} onClick={() => listening ? recognition.current?.stop() : startListening()}><Mic className={listening ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} /></Button>
        <Button type="submit" size="icon" aria-label={editingTurnId !== null ? 'Reenviar pergunta corrigida' : 'Enviar pergunta'} disabled={busy || listening || !input.trim()}><Send className="h-4 w-4" /></Button>
      </form>
      <p className="px-3 pb-2 text-[11px] text-muted-foreground">Não envie dados sensíveis. Confirme informações importantes antes de tomar decisões.</p>
    </section>}
    <Button
      type="button"
      size="icon"
      style={{ position: 'fixed', left: position.x, top: position.y, touchAction: 'none' }}
      className="z-[72] h-14 w-14 cursor-grab select-none rounded-full border-[3px] border-background bg-primary p-0 text-primary-foreground shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.55)] ring-1 ring-primary/25 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary"
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onKeyDown={moveWithKeyboard}
      onClick={() => {
        if (ignoreClickRef.current) { ignoreClickRef.current = false; return; }
        if (open) closeChat(); else setOpen(true);
      }}
      aria-expanded={open}
      aria-label={open ? 'Fechar assistente de IA. Arraste para mover o botão.' : 'Abrir assistente de IA. Arraste para mover o botão.'}
      title="Arraste para mover • Toque para conversar"
    >
      {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Bot className="h-6 w-6" aria-hidden="true" />}
    </Button>
  </div>;
}
