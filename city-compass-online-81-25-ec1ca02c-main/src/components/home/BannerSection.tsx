
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Skeleton } from '@/components/ui/skeleton';
import { type CarouselApi } from '@/components/ui/carousel';

interface BannerSectionProps {
  secao?: 'home' | 'locais' | 'eventos' | 'categorias' | 'busca';
}

interface Banner {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url?: string;
  ativo: boolean;
  ordem: number;
  secao: string;
  criado_em: string;
  atualizado_em: string;
}

// Função para embaralhar array usando algoritmo Fisher-Yates
const shuffleArray = (array: Banner[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const BannerSection = ({ secao = 'home' }: BannerSectionProps) => {
  const navigate = useNavigate();
  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners-publicitarios', secao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners_publicitarios')
        .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
        .eq('ativo', true)
        .eq('secao', secao === 'locais' ? 'empresas' : secao)
        .order('ordem', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Banner[];
    },
  });

  // Embaralha os banners a cada renderização para rotação aleatória
  const shuffledBanners = useMemo(() => {
    if (!banners || banners.length === 0) return [];
    return shuffleArray(banners);
  }, [banners]);

  // Auto-rotation logic
  const [api, setApi] = useState<CarouselApi>();

  const scrollToNext = useCallback(() => {
    if (api && shuffledBanners.length > 1) {
      api.scrollNext();
    }
  }, [api, shuffledBanners.length]);

  useEffect(() => {
    if (!api || shuffledBanners.length <= 1) return;

    // Preload first banner image for LCP optimization
    if (shuffledBanners.length > 0) {
      const firstBannerUrl = shuffledBanners[0].imagem_url;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = firstBannerUrl;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    }

    const interval = setInterval(() => {
      scrollToNext();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [api, scrollToNext, shuffledBanners]);

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <div className="relative">
          <Skeleton className="w-full aspect-[970/250] rounded-lg" />
        </div>
      </section>
    );
  }

  if (!shuffledBanners || shuffledBanners.length === 0) {
    return null;
  }

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      try {
        const url = new URL(banner.link_url);
        const isExternal = url.hostname !== window.location.hostname;
        
        if (isExternal) {
          // Link externo - abrir em nova guia
          window.open(banner.link_url, '_blank', 'noopener,noreferrer');
        } else {
          // Link interno - navegar na mesma guia
          const pathname = url.pathname + url.search + url.hash;
          navigate(pathname);
        }
      } catch (error) {
        // Se não for uma URL válida, tratar como link interno
        if (banner.link_url.startsWith('/')) {
          navigate(banner.link_url);
        } else {
          // Se não começar com /, assumir que é externo
          window.open(banner.link_url, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      <Carousel 
        className="w-full" 
        opts={{ align: "start", loop: true }}
        setApi={setApi}
      >
        <CarouselContent className="-ml-2">
          {shuffledBanners.map((banner, index) => (
            <CarouselItem key={banner.id} className="pl-2 basis-full">
              <Card 
                className={`overflow-hidden border-0 shadow-md w-full transition-all duration-500 ${banner.link_url ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-300' : ''}`}
                onClick={() => handleBannerClick(banner)}
              >
                <div className="relative w-full aspect-[970/250]">
                  <img
                    src={banner.imagem_url}
                    alt="Banner publicitário"
                    className="w-full h-full object-cover transition-opacity duration-500"
                    {...(index === 0 ? { 
                      fetchPriority: "high" as const,
                      loading: "eager" as const 
                    } : { 
                      loading: "lazy" as const 
                    })}
                    decoding="async"
                    width="970"
                    height="250"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 970px"
                    style={{ aspectRatio: '970/250' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};
