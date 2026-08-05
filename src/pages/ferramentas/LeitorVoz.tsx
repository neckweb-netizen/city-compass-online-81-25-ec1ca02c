import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Play, Pause, Square, Volume2, Sparkles, Trash2, Gauge, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeitorVoz = () => {
  const navigate = useNavigate();

  // FORMULÁRIO 100% LIMPO
  const [texto, setTexto] = useState('');
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);
  const [vozSelecionada, setVozSelecionada] = useState<string>('');
  const [velocidade, setVelocidade] = useState<number>(1);
  const [tom, setTom] = useState<number>(1);

  // ESTADOS DE REPRODUÇÃO
  const [lendo, setLendo] = useState(false);
  const [pausado, setPausado] = useState(false);

  // CARREGAR VOZES DISPONÍVEIS NO DISPOSITIVO
  useEffect(() => {
    const carregarVozes = () => {
      if ('speechSynthesis' in window) {
        const disponiveis = window.speechSynthesis.getVoices();
        const vozesPt = disponiveis.filter(v => v.lang.includes('pt') || v.lang.includes('PT'));
        const listaFinal = vozesPt.length > 0 ? vozesPt : disponiveis;
        
        setVozes(listaFinal);
        if (listaFinal.length > 0 && !vozSelecionada) {
          setVozSelecionada(listaFinal[0].name);
        }
      }
    };

    carregarVozes();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = carregarVozes;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // INICIAR A LEITURA
  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta a função de leitura em voz alta.');
      return;
    }

    if (!texto.trim()) {
      alert('Por favor, digite ou cole um texto para ser lido.');
      return;
    }

    if (pausado) {
      window.speechSynthesis.resume();
      setPausado(false);
      setLendo(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.rate = velocidade;
    utterance.pitch = tom;

    const vozEncontrada = vozes.find(v => v.name === vozSelecionada);
    if (vozEncontrada) {
      utterance.voice = vozEncontrada;
    }

    utterance.onend = () => {
      setLendo(false);
      setPausado(false);
    };

    utterance.onerror = () => {
      setLendo(false);
      setPausado(false);
    };

    window.speechSynthesis.speak(utterance);
    setLendo(true);
    setPausado(false);
  };

  // PAUSAR LEITURA
  const handlePause = () => {
    if ('speechSynthesis' in window && lendo) {
      window.speechSynthesis.pause();
      setPausado(true);
      setLendo(false);
    }
  };

  // PARAR LEITURA
  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setLendo(false);
      setPausado(false);
    }
  };

  // LIMPAR TEXTO
  const handleLimpar = () => {
    handleStop();
    setTexto('');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Acessibilidade & Áudio
          </span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Leitor de Texto em Voz Alta (IA)
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Cole ou digite qualquer texto para ouvir em áudio com ajuste de voz, tom e velocidade.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ÁREA DE TEXTO */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" /> Digite ou Cole seu Texto
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Suporta artigos, recados, mensagens e documentos
                  </CardDescription>
                </div>
                {texto && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLimpar}
                    className="text-xs text-destructive hover:text-destructive/80 h-7 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Digite ou cole o texto que deseja ouvir aqui..." 
                  value={texto} 
                  onChange={e => setTexto(e.target.value)} 
                  className="min-h-[220px] text-xs sm:text-sm leading-relaxed p-4 resize-none border-border/60"
                />

                {/* BOTÕES DE CONTROLE DE ÁUDIO */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {!lendo ? (
                    <Button 
                      onClick={handlePlay} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl gap-2 shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" /> {pausado ? 'Continuar Leitura' : 'Ouvir Texto'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePause} 
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-6 rounded-xl gap-2 shadow-md"
                    >
                      <Pause className="w-4 h-4 fill-current" /> Pausar
                    </Button>
                  )}

                  <Button 
                    onClick={handleStop} 
                    disabled={!lendo && !pausado} 
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 font-bold h-11 px-5 rounded-xl gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" /> Parar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AJUSTES E CONFIGURAÇÕES DA VOZ */}
          <div className="space-y-4">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" /> Configurações de Áudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                
                {/* SELETOR DE VOZ */}
                <div>
                  <Label className="text-xs font-semibold block mb-1.5">Voz do Narrador</Label>
                  <Select value={vozSelecionada} onValueChange={setVozSelecionada}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione uma voz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vozes.map((item, index) => (
                        <SelectItem key={index} value={item.name} className="text-xs">
                          {item.name} ({item.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CONTROLE DE VELOCIDADE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="font-semibold">Velocidade</Label>
                    <span className="text-muted-foreground font-mono">{velocidade}x</span>
                  </div>
                  <Slider 
                    value={[velocidade]} 
                    min={0.5} 
                    max={2} 
                    step={0.1} 
                    onValueChange={v => setVelocidade(v[0])} 
                  />
                </div>

                {/* CONTROLE DE TOM */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="font-semibold">Tom da Voz</Label>
                    <span className="text-muted-foreground font-mono">{tom}</span>
                  </div>
                  <Slider 
                    value={[tom]} 
                    min={0.5} 
                    max={1.5} 
                    step={0.1} 
                    onValueChange={v => setTom(v[0])} 
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
