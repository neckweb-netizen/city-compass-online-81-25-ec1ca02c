import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, VolumeX, Radio } from 'lucide-react';
import { getSafeRadioStreamUrl } from '@/lib/radioStream';

interface RadioPlayerProps {
  radioUrl: string;
  stationName: string;
  className?: string;
}

const RADIO_PLAY_EVENT = 'sajtem:radio-playing';

export const RadioPlayer: React.FC<RadioPlayerProps> = ({ radioUrl, stationName, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerId = useRef(crypto.randomUUID());
  const requestId = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safeUrl = getSafeRadioStreamUrl(radioUrl);

  const pauseAudio = () => {
    requestId.current += 1;
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsLoading(false);
  };

  const stopAudio = () => {
    pauseAudio();
    const audio = audioRef.current;
    if (audio) {
      audio.removeAttribute('src');
      audio.load();
    }
    setError(null);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume[0] / 100;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const onOtherStationPlaying = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== playerId.current) {
        requestId.current += 1;
        audioRef.current?.pause();
        setIsPlaying(false);
        setIsLoading(false);
      }
    };
    window.addEventListener(RADIO_PLAY_EVENT, onOtherStationPlaying);
    return () => {
      window.removeEventListener(RADIO_PLAY_EVENT, onOtherStationPlaying);
      requestId.current += 1;
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    // Quando a fonte da rádio mudar, não continuar tocando um stream antigo.
    requestId.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, [radioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying || !audio.paused) {
      pauseAudio();
      return;
    }
    if (!safeUrl) {
      setError('O endereço de transmissão desta rádio não é válido.');
      return;
    }
    if (window.location.protocol === 'https:' && safeUrl.startsWith('http:')) {
      setError('Esta transmissão usa HTTP e pode ser bloqueada pelo navegador. A rádio precisa fornecer um endereço HTTPS.');
      return;
    }
    const request = ++requestId.current;
    setError(null);
    setIsLoading(true);
    try {
      if (audio.src !== safeUrl) audio.src = safeUrl;
      // A troca é enviada antes de iniciar a reprodução, evitando dois streams ativos.
      window.dispatchEvent(new CustomEvent(RADIO_PLAY_EVENT, { detail: playerId.current }));
      await audio.play();
      if (requestId.current !== request) {
        audio.pause();
        return;
      }
      setIsPlaying(true);
    } catch {
      if (requestId.current !== request) return;
      setIsPlaying(false);
      setError('Não foi possível reproduzir esta rádio. Verifique a transmissão e tente novamente.');
    } finally {
      if (requestId.current === request) setIsLoading(false);
    }
  };

  return (
    <Card className={\`w-full max-w-md mx-auto bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl \${className}\`}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-white">
          <Radio className="w-6 h-6 text-white" />
          {stationName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <audio
          ref={audioRef}
          preload="none"
          aria-label={\`Transmissão de \${stationName}\`}
          onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
          onPause={() => { setIsPlaying(false); setIsLoading(false); }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => { setIsPlaying(true); setIsLoading(false); setError(null); }}
          onEnded={() => { setIsPlaying(false); setIsLoading(false); }}
          onError={() => {
            setIsPlaying(false);
            setIsLoading(false);
            setError('Não foi possível carregar a transmissão. Confira a conexão ou tente novamente.');
          }}
        />
        {error && <div role="alert" className="bg-red-800/50 border border-red-600 rounded-lg p-3 text-sm text-white">{error}</div>}
        {!safeUrl && <p className="text-center text-sm text-white/90">Esta rádio ainda não possui um endereço de transmissão válido.</p>}
        <div className="flex justify-center items-center gap-4">
          <Button
            type="button" onClick={() => void togglePlay()}
            disabled={isLoading || !safeUrl}
            aria-label={isPlaying ? \`Pausar \${stationName}\` : \`Reproduzir \${stationName}\`}
            size="lg"
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105"
          >
            {isLoading ? <span aria-hidden="true" className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
              isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
          </Button>
          <Button
            type="button" onClick={stopAudio}
            disabled={!isPlaying && !isLoading}
            aria-label={\`Parar \${stationName}\`}
            size="lg"
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105"
          >
            <Square className="w-6 h-6 text-white" />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white opacity-90">Volume</span>
            <Button
              type="button" onClick={() => setIsMuted(value => !value)}
              aria-label={isMuted ? \`Ativar som de \${stationName}\` : \`Silenciar \${stationName}\`}
              variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </Button>
          </div>
          <Slider value={volume} onValueChange={setVolume} max={100} step={1} aria-label="Volume da rádio" />
          <div className="text-xs text-center text-white opacity-75">{isMuted ? 'Mudo' : \`\${volume[0]}%\`}</div>
        </div>
        <div role="status" aria-live="polite" className="text-center text-sm text-white/80">
          {isLoading ? 'Carregando...' : isPlaying ? 'Reproduzindo ao vivo' : 'Pausado'}
        </div>
      </CardContent>
    </Card>
  );
};
