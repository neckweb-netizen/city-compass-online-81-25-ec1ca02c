import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoPlayerWithAdProps {
  videoUrl: string;
  videoTitle: string;
  className?: string;
}

interface Banner {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url?: string;
  tipo_midia?: 'imagem' | 'video';
}

export const VideoPlayerWithAd = ({ videoUrl, videoTitle, className }: VideoPlayerWithAdProps) => {
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | HTMLIFrameElement>(null);

  // Buscar banners para vídeos do canal
  const { data: banners } = useQuery({
    queryKey: ['canal-video-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners_publicitarios')
        .select('id, titulo, imagem_url, link_url, tipo_midia')
        .eq('secao', 'canal_video')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return (data as any) || [];
    },
  });

  const selectedBanner = banners && banners.length > 0 
    ? banners[Math.floor(Math.random() * banners.length)]
    : null;

  useEffect(() => {
    if (isPlaying && selectedBanner) {
      setShowAd(true);
      setAdCountdown(5);
      setCanSkip(false);

      const countdownInterval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isPlaying, selectedBanner]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleSkipAd = () => {
    setShowAd(false);
  };

  const handleAdClick = () => {
    if (selectedBanner?.link_url) {
      window.open(selectedBanner.link_url, '_blank');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if ('muted' in videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      }
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('/embed/')) {
      return url;
    }
    
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const videoId = urlParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }
    
    return url;
  };

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || 
           isYouTubeUrl(url) ||
           url.includes('blob:') ||
           url.includes('data:video/');
  };

  const isAdVideo = selectedBanner?.tipo_midia === 'video' && selectedBanner?.imagem_url && isVideoUrl(selectedBanner.imagem_url);

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
      {/* Banner Publicitário - Totalmente Responsivo */}
      {showAd && selectedBanner && (
        <div className="absolute inset-0 z-50 bg-black rounded-xl overflow-hidden">
          <div className="relative w-full h-full">
            {/* Banner Content - Encaixa perfeitamente no container */}
            <div 
              className="w-full h-full cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={handleAdClick}
            >
              {isAdVideo ? (
                // Vídeo como banner - mantém aspect ratio do container
                <div className="w-full h-full relative rounded-xl overflow-hidden">
                  {isYouTubeUrl(selectedBanner.imagem_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedBanner.imagem_url) + '&autoplay=1&mute=1&loop=1'}
                      className="w-full h-full rounded-xl"
                      style={{ objectFit: 'cover' }}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title="Banner publicitário"
                    />
                  ) : (
                    <video
                      src={selectedBanner.imagem_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        console.error('Erro ao carregar vídeo do banner:', e);
                        // Fallback para imagem se o vídeo não carregar
                        const videoElement = e.target as HTMLVideoElement;
                        const img = document.createElement('img');
                        img.src = selectedBanner.imagem_url;
                        img.className = 'w-full h-full object-cover rounded-xl';
                        img.alt = 'Banner publicitário';
                        videoElement.parentNode?.replaceChild(img, videoElement);
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
                </div>
              ) : (
                // Imagem como banner - otimizada para 16:9
                <div className="w-full h-full relative rounded-xl overflow-hidden">
                  <img
                    src={selectedBanner.imagem_url}
                    alt="Banner publicitário"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 rounded-xl"
                    style={{ aspectRatio: '16/9' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:from-black/40 transition-all duration-300 rounded-xl" />
                </div>
              )}
            </div>

            {/* Ad Info Badge - Responsivo */}
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-black/90 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2">
              <p className="text-white text-xs md:text-sm font-semibold tracking-wide">PUBLICIDADE</p>
            </div>

            {/* Skip Button - Layout responsivo otimizado */}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2">
              {!canSkip && (
                <div className="bg-black/90 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 min-w-[80px] text-center">
                  <p className="text-white text-xs md:text-sm font-medium">
                    {adCountdown}s
                  </p>
                </div>
              )}
              {canSkip && (
                <Button
                  onClick={handleSkipAd}
                  variant="secondary"
                  size="sm"
                  className="bg-white/95 text-black hover:bg-white shadow-lg text-xs md:text-sm px-3 py-2 h-auto rounded-full font-semibold min-w-[80px] transition-all duration-200 hover:scale-105"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Pular
                </Button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Video Content */}
      {!isPlaying ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center group cursor-pointer">
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"
            onClick={handlePlay}
          />
          <Button
            onClick={handlePlay}
            className="absolute z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 hover:bg-white text-black hover:scale-110 transition-all duration-300"
            size="icon"
          >
            <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" fill="currentColor" />
          </Button>
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-10">
            <h4 className="text-white text-xs sm:text-sm font-medium drop-shadow-lg line-clamp-2">
              {videoTitle}
            </h4>
          </div>
        </div>
      ) : !showAd ? (
        <div className="w-full h-full relative">
          {isYouTubeUrl(videoUrl) ? (
            <iframe
              ref={videoRef as React.RefObject<HTMLIFrameElement>}
              src={getYouTubeEmbedUrl(videoUrl)}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={videoTitle}
            />
          ) : (
            <>
              <video
                ref={videoRef as React.RefObject<HTMLVideoElement>}
                src={videoUrl}
                controls
                autoPlay
                muted={isMuted}
                className="w-full h-full"
                preload="metadata"
              />
              <Button
                onClick={toggleMute}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 hover:bg-black/70 text-white"
                size="icon"
              >
                {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};