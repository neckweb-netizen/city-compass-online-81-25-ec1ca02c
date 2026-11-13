
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { optimizedBannerByUrl } from '@/lib/optimizedLegacyBanners';
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

// Compartilhada com a página inicial para antecipar a busca do banner LCP.
export async function loadBanners(secao: NonNullable<BannerSectionProps['secao']>): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners_publicitarios')
    .select('id, titulo, imagem_url, link_url, ativo, ordem, secao, criado_em, atualizado_em')
    .eq('ativo', true)
    .eq('secao', secao === 'locais' ? 'empresas' : secao)
    .order('ordem', { ascending: true })
    .limit(10);
  if (error) throw error;
  return data as Banner[];
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
    queryFn: () => loadBanners(secao),
    staleTime: 2 * 60 * 1000,
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
                className={`overflow-hidden border-0 shadow-md w-full transition-all duration-500 ${banner.link_url ? 'cursor-pointer hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow duration-200' : ''}`}
                onClick={() => handleBannerClick(banner)}
                role={banner.link_url ? "link" : undefined}
                tabIndex={banner.link_url ? 0 : undefined}
                aria-label={banner.link_url ? `Abrir banner: ${banner.titulo}` : undefined}
                onKeyDown={(event) => { if (banner.link_url && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); handleBannerClick(banner); } }}
              >
                <div className="relative w-full aspect-[970/250]">
                  <img
                    src={optimizedBannerByUrl[banner.imagem_url]?.src ?? banner.imagem_url}
                    srcSet={optimizedBannerByUrl[banner.imagem_url]?.srcSet}
                    alt={banner.titulo || "Banner publicitário"}
                    className="w-full h-full object-cover transition-opacity duration-500"
                    {...(index === 0 ? {
                      loading: "eager" as const,
                      fetchPriority: "high" as const
                    } : { 
                      loading: "lazy" as const 
                    })}
                    decoding="async"
                    width="970"
                    height="250"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 970px"
                    style={{ aspectRatio: '970/250' }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      // If a generated WebP is missing, automatically restore the
                      // original public PNG instead of showing a broken banner.
                      if (optimizedBannerByUrl[banner.imagem_url] && target.src !== banner.imagem_url) {
                        target.srcset = '';
                        target.src = banner.imagem_url;
                        return;
                      }
                      if (!target.src.endsWith('/placeholder.svg')) target.src = '/placeholder.svg';
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
