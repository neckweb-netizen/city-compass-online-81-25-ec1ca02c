import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Volume2, Play, Pause, Square, Sparkles, RefreshCw, Trash2, FileText, VolumeX, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

export const LeitorVoz = () => {
  const navigate = useNavigate();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const generationRef = useRef(0);

  // ESTADOS DO TEXTO E DA LEITURA
  const [texto, setTexto] = useState('');
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);

  // CONFIGURAÇÕES DA VOZ
  const [vozesDisponiveis, setVozesDisponiveis] = useState<SpeechSynthesisVoice[]>([]);
  const [vozSelecionada, setVozSelecionada] = useState<string>('');
  const [velocidade, setVelocidade] = useState<number>(1); // 0.5 até 2
  const [tom, setTom] = useState<number>(1); // 0.5 até 1.5
  const [volume, setVolume] = useState<number>(1); // 0 até 1

  // O navegador pode disponibilizar as vozes depois do primeiro carregamento.
  const carregarVozes = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    const lista = window.speechSynthesis.getVoices();
    setVozesDisponiveis(lista);
    setVozSelecionada(current => {
      if (current && lista.some(voice => voice.name === current)) return current;
      return (lista.find(voice => voice.lang.toLowerCase().startsWith('pt-br'))
        ?? lista.find(voice => voice.lang.toLowerCase().startsWith('pt'))
        ?? lista[0])?.name ?? '';
    });
  }, []);

  useEffect(() => {
    carregarVozes();
    if (!('speechSynthesis' in window)) return;
    const engine = window.speechSynthesis;
    engine.addEventListener('voiceschanged', carregarVozes);
    return () => {
      generationRef.current += 1;
      utteranceRef.current = null;
      engine.removeEventListener('voiceschanged', carregarVozes);
      engine.cancel();
    };
  }, [carregarVozes]);

  // Retomar apenas a fala atual; novas leituras invalidam callbacks antigos.
  const handleIniciarLeitura = () => {
    if (!texto.trim()) {
      toast.error('Digite ou cole um texto antes de iniciar a leitura.');
      return;
    }
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      toast.error('Seu navegador não suporta a funcionalidade de conversão de texto em voz.');
      return;
    }
    const engine = window.speechSynthesis;
    if (pausado && utteranceRef.current) {
      engine.resume();
      setLendo(true);
      setPausado(false);
      return;
    }

    const generation = ++generationRef.current;
    engine.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utteranceRef.current = utterance;
    utterance.lang = 'pt-BR';
    const selectedVoice = vozesDisponiveis.find(v => v.name === vozSelecionada);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = velocidade;
    utterance.pitch = tom;
    utterance.volume = volume;
    utterance.onstart = () => {
      if (generation !== generationRef.current) return;
      setLendo(true);
      setPausado(false);
    };
    utterance.onend = () => {
      if (generation !== generationRef.current) return;
      utteranceRef.current = null;
      setLendo(false);
      setPausado(false);
    };
    utterance.onerror = event => {
      if (generation !== generationRef.current) return;
      utteranceRef.current = null;
      setLendo(false);
      setPausado(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        toast.error('Ocorreu um erro ao reproduzir o áudio.');
      }
    };
    try {
      engine.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setLendo(false);
      setPausado(false);
      toast.error('Não foi possível iniciar a leitura neste navegador.');
    }
  };

  const handlePausarLeitura = () => {
    if (!('speechSynthesis' in window)) return;
    const engine = window.speechSynthesis;
    if (engine.speaking && !engine.paused) {
      engine.pause();
      setLendo(false);
      setPausado(true);
    }
  };

  const handlePararLeitura = () => {
    generationRef.current += 1;
    utteranceRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setLendo(false);
    setPausado(false);
  };

  // LIMPAR O TEXTO
  const handleLimparTexto = () => {
    handlePararLeitura();
    setTexto('');
    toast.info('Texto limpo com sucesso.');
  };

  // ESTATÍSTICAS DO TEXTO
  const totalCaracteres = texto.length;
  const totalPalavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  const tempoEstimadoLeituraMinutos = Math.ceil(totalPalavras / 130);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/ferramentas')} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Leitor IA Natural
          </Badge>
        </div>

        {/* BANNER DINÂMICO LOCAL */}
        <ToolBanner secao="leitor_voz" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            <Volume2 className="w-8 h-8 text-indigo-500" /> Leitor de Texto em Voz Alta
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Converta qualquer texto em áudio narrado com voz natural, controle de velocidade, tom e volume em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PAINEL PRINCIPAL DO TEXTO */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Digite ou Cole seu Texto
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Insira notícias, artigos, comunicados ou livros para escutar
                  </CardDescription>
                </div>
                {texto && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLimparTexto}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Cole aqui seu texto completo para ouvir a narração..." 
                  value={texto} 
                  onChange={e => {
                    if (lendo || pausado) handlePararLeitura();
                    setTexto(e.target.value);
                  }} 
                  className="min-h-[260px] text-sm sm:text-base leading-relaxed p-4 bg-muted/20 border-border resize-y"
                />

                {/* MÉTRICAS DO TEXTO */}
                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t pt-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span>Palavras: <strong className="text-foreground">{totalPalavras}</strong></span>
                    <span>Caracteres: <strong className="text-foreground">{totalCaracteres}</strong></span>
                  </div>
                  {totalPalavras > 0 && (
                    <span>Tempo est. áudio: <strong className="text-indigo-500">~{tempoEstimadoLeituraMinutos} min</strong></span>
                  )}
                </div>

                {/* CONTROLES DE REPRODUÇÃO */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!lendo ? (
                    <Button 
                      onClick={handleIniciarLeitura} 
                      disabled={!texto.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl gap-2 shadow-md text-sm"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{pausado ? 'Continuar Lendo' : 'Iniciar Leitura'}</span>
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePausarLeitura} 
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 rounded-xl gap-2 shadow-md text-sm"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pausar</span>
                    </Button>
                  )}

                  {(lendo || pausado) && (
                    <Button 
                      variant="outline" 
                      onClick={handlePararLeitura}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 font-bold h-12 px-5 rounded-xl gap-2 text-sm"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Parar</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DE CONFIGURAÇÕES DE VOZ */}
          <div className="space-y-4">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-500" /> Ajustes da Voz
                </CardTitle>
                <CardDescription className="text-xs">
                  Personalize o locutor e os controles de áudio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                
                {/* SELETOR DE VOZ */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Locutor / Voz</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={carregarVozes} title="Recarregar vozes">
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </Label>

                  {vozesDisponiveis.length > 0 ? (
                    <Select value={vozSelecionada} onValueChange={setVozSelecionada}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue placeholder="Selecione a voz..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {vozesDisponiveis.map((v) => (
                          <SelectItem key={v.name} value={v.name} className="text-xs">
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                      Carregando vozes do seu sistema... Se não aparecer, verifique o suporte do seu dispositivo.
                    </p>
                  )}
                </div>

                {/* VELOCIDADE DA LEITURA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Velocidade de Fala</span>
                    <span className="text-indigo-500 font-bold">{velocidade}x</span>
                  </div>
                  <Slider 
                    value={[velocidade]} 
                    min={0.5} 
                    max={2} 
                    step={0.1} 
                    onValueChange={(val) => setVelocidade(val[0])}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Lento (0.5x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Rápido (2.0x)</span>
                  </div>
                </div>

                {/* TOM DA VOZ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Tom de Voz (Pitch)</span>
                    <span className="text-indigo-500 font-bold">{tom}</span>
                  </div>
                  <Slider 
                    value={[tom]} 
                    min={0.5} 
                    max={1.5} 
                    step={0.1} 
                    onValueChange={(val) => setTom(val[0])}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Grave</span>
                    <span>Padrão</span>
                    <span>Agudo</span>
                  </div>
                </div>

                {/* VOLUME */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                      Volume
                    </span>
                    <span className="text-indigo-500 font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider 
                    value={[volume]} 
                    min={0} 
                    max={1} 
                    step={0.05} 
                    onValueChange={(val) => setVolume(val[0])}
                  />
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LeitorVoz;
