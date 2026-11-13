import { getOptimizedImageUrl, getOptimizedImageSrcSet } from '@/lib/imageOptimization';

import React from 'react';
import { Search, Building, Tag, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SearchSuggestionsProps {
  suggestions: {
    empresas: any[];
    categorias: any[];
    cidades: any[];
  };
  onSuggestionClick: (type: 'empresa' | 'categoria' | 'cidade', item: any) => void;
  isVisible: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isVisible
}) => {
  if (!isVisible) return null;

  const hasResults = suggestions.empresas.length > 0 || 
                    suggestions.categorias.length > 0 || 
                    suggestions.cidades.length > 0;

  if (!hasResults) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 p-4 shadow-lg bg-background border">
        <div className="text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum resultado encontrado</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg bg-background border max-h-80 overflow-y-auto">
      {/* Empresas */}
      {suggestions.empresas.length > 0 && (
        <div className="p-2 border-b">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresas
          </h4>
          {suggestions.empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => onSuggestionClick('empresa', empresa)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {empresa.imagem_capa_url && (
                <img 
                  src={getOptimizedImageUrl(empresa.imagem_capa_url, 320)}
                  srcSet={getOptimizedImageSrcSet(empresa.imagem_capa_url)}
                  loading="lazy"
                  decoding="async"
                  width={36}
                  height={36} 
                  alt={empresa.nome}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{empresa.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{empresa.endereco}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categorias */}
      {suggestions.categorias.length > 0 && (
        <div className="p-2 border-b">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </h4>
          {suggestions.categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => onSuggestionClick('categoria', categoria)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {categoria.icone_url && (
                <span className="text-lg">{categoria.icone_url}</span>
              )}
              <span className="font-medium text-sm">{categoria.nome}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cidades */}
      {suggestions.cidades.length > 0 && (
        <div className="p-2">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cidades
          </h4>
          {suggestions.cidades.map((cidade) => (
            <button
              key={cidade.id}
              onClick={() => onSuggestionClick('cidade', cidade)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{cidade.nome}, {cidade.estado}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};
