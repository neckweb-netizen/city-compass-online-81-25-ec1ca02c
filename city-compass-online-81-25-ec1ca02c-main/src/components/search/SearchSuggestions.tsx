
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
              className="w-full text-left p-2 hover:bg-muted rounded flex items-center gap-3 transition-colors"
            >
              {empresa.imagem_capa_url && (
                <img 
                  src={empresa.imagem_capa_url} 
                  alt={empresa.nome}
                  className="h-8 w-8 rounded object-cover"
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
              className="w-full text-left p-2 hover:bg-muted rounded flex items-center gap-3 transition-colors"
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
              className="w-full text-left p-2 hover:bg-muted rounded flex items-center gap-3 transition-colors"
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
