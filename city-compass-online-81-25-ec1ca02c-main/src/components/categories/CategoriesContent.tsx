
import { useCategorias } from '@/hooks/useCategorias';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { BannerSection } from '@/components/home/BannerSection';

export const CategoriesContent = () => {
  const { data: cidadePadrao } = useCidadePadrao();
  const { data: categorias, isLoading } = useCategorias();
  const navigate = useNavigate();

  const handleCategoryClick = (slug: string) => {
    navigate(`/categoria/${slug}`);
  };

  const renderIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return <span className="text-2xl">📋</span>;
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <NeonCard key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </CardContent>
            </NeonCard>
          ))}
        </div>
      </div>
    );
  }

  if (!categorias?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhuma categoria disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  // Dividir categorias em dois grupos: primeiras 8 e restantes
  const primeirasCategorias = categorias.slice(0, 8);
  const categoriasRestantes = categorias.slice(8);

  console.log('Total de categorias:', categorias.length);
  console.log('Primeiras 8 categorias:', primeirasCategorias.length);
  console.log('Categorias restantes:', categoriasRestantes.length);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Categorias</h1>
        <p className="text-gray-600">
          Explore todas as categorias disponíveis {cidadePadrao?.nome && `em ${cidadePadrao.nome}`}
        </p>
      </div>

      {/* Primeiras 8 categorias */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {primeirasCategorias.map((categoria) => (
          <NeonCard 
            key={categoria.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCategoryClick(categoria.slug)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center relative">
                {renderIcon(categoria)}
                <span className="fallback-icon text-2xl hidden">📋</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{categoria.nome}</h3>
              <Badge variant="secondary" className="text-xs">
                {categoria.tipo}
              </Badge>
            </CardContent>
          </NeonCard>
        ))}
      </div>

      {/* Banner após 8 categorias - sempre mostrar se houver mais de 8 categorias */}
      {categorias.length > 8 && (
        <div className="mb-8">
          <BannerSection secao="categorias" />
        </div>
      )}

      {/* Categorias restantes */}
      {categoriasRestantes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoriasRestantes.map((categoria) => (
            <NeonCard 
              key={categoria.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCategoryClick(categoria.slug)}
            >
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center relative">
                  {renderIcon(categoria)}
                  <span className="fallback-icon text-2xl hidden">📋</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{categoria.nome}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoria.tipo}
                </Badge>
              </CardContent>
            </NeonCard>
          ))}
        </div>
      )}
    </div>
  );
};
