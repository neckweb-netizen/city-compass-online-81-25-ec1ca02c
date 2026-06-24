
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategorias } from '@/hooks/useCategorias';
import { Card, CardContent } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CategoriesGrid = () => {
  const { data: categorias, isLoading, error } = useCategorias();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoriaClick = (categoriaSlug: string) => {
    navigate(`/categoria/${categoriaSlug}`);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const renderIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return <span className="text-2xl">🏢</span>;
    }

    // Se for um emoji (caracteres Unicode) - regex expandida para cobrir mais emojis
    if (categoria.icone_url.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{20E3}]|[\u{2700}-\u{27BF}]|[\u{24C2}]|[\u{1F170}-\u{1F251}]/u)) {
      return <span className="text-2xl">{categoria.icone_url}</span>;
    }

    // Se for uma URL
    return (
      <img 
        src={categoria.icone_url} 
        alt={categoria.nome}
        className="w-8 h-8 object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
          if (fallback) {
            fallback.style.display = 'inline';
          }
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <NeonCard className="py-6 sm:py-8 lg:py-12 mx-2 sm:mx-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Categorias</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Explore as diferentes categorias de empresas e serviços disponíveis
          </p>
        </div>

        <div className="relative group">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-8 sm:px-12 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="min-w-20 sm:min-w-24 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                  <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </NeonCard>
    );
  }

  if (error || !categorias?.length) {
    return null;
  }

  return (
    <NeonCard className="py-6 sm:py-8 lg:py-12 mx-2 sm:mx-4">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Categorias</h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
          Explore as diferentes categorias de empresas e serviços disponíveis
        </p>
      </div>

        <div className="relative group">
          {/* Botões de navegação sempre visíveis */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            onClick={scrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-8 sm:px-12 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categorias.map((categoria) => (
              <Card 
                key={categoria.id}
                className="min-w-20 sm:min-w-24 flex-shrink-0 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:scale-105"
                onClick={() => handleCategoriaClick(categoria.slug)}
              >
                <CardContent className="p-2 sm:p-3 text-center space-y-1 sm:space-y-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center relative">
                    {renderIcon(categoria)}
                    <span className="fallback-icon text-xl sm:text-2xl hidden">🏢</span>
                  </div>
                  <p className="text-xs font-medium leading-tight line-clamp-2">{categoria.nome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </NeonCard>
  );
};
