import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, VolumeX, Radio } from 'lucide-react';

interface RadioPlayerProps {
  radioUrl: string;
  stationName: string;
  className?: string;
}

export const RadioPlayer: React.FC<RadioPlayerProps> = ({ 
  radioUrl, 
  stationName, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      setError(null);
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        
        // Definir a URL do stream
        if (audioRef.current.src !== radioUrl) {
          audioRef.current.src = radioUrl;
        }
        
        // Tentar reproduzir diretamente
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Reprodução iniciada com sucesso');
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch((err) => {
              console.error('Erro ao reproduzir:', err);
              setError('Erro ao conectar com a rádio. Tente novamente.');
              setIsPlaying(false);
              setIsLoading(false);
            });
        }
      }
    } catch (err) {
      console.error('Erro ao reproduzir rádio:', err);
      setError('Erro ao conectar com a rádio. Tente novamente em alguns segundos.');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
      setIsLoading(false);
      setError(null);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume[0] / 100;
    }
  };

  const handleAudioError = (e: any) => {
    console.error('Erro no áudio:', e);
    setError('Não foi possível carregar a rádio. Verifique a conexão ou tente novamente.');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    console.log('Carregando stream de rádio...');
  };

  const handleCanPlay = () => {
    console.log('Stream pronto para reprodução');
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
    console.log('Reprodução iniciada');
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsLoading(false);
    console.log('Reprodução pausada');
  };

  const handleWaiting = () => {
    setIsLoading(true);
    console.log('Aguardando dados do stream...');
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setError(null);
    console.log('Stream reproduzindo normalmente');
  };

  return (
    <Card className={`w-full max-w-md mx-auto bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl ${className}`}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-white">
          <Radio className="w-6 h-6 text-white" />
          {stationName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Audio element */}
        <audio
          ref={audioRef}
          onError={handleAudioError}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          preload="none"
        />

        {/* Error display */}
        {error && (
          <div className="bg-red-800/50 border border-red-600 rounded-lg p-3 text-sm text-white">
            {error}
          </div>
        )}

        {/* Control buttons */}
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="lg"
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </Button>
          
          <Button
            onClick={stopAudio}
            disabled={isLoading}
            size="lg"
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105"
          >
            <Square className="w-6 h-6 text-white" />
          </Button>
        </div>

        {/* Volume controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white opacity-90">Volume</span>
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
          
          <div className="px-1">
            <Slider
              value={isMuted ? [0] : volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
              disabled={isMuted}
            />
          </div>
          
          <div className="text-xs text-center text-white opacity-75">
            {isMuted ? 'Mudo' : `${volume[0]}%`}
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 text-sm ${
            isPlaying ? 'text-green-200' : 'text-white/70'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/50'
            }`} />
            {isLoading ? 'Carregando...' : isPlaying ? 'Reproduzindo ao vivo' : 'Pausado'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
