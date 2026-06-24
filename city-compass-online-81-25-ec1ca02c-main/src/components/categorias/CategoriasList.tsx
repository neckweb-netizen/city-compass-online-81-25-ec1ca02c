
import React from 'react';
import { useCategorias } from '@/hooks/useCategorias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoriasListProps {
  selectedCategoriaId?: string;
  onCategoriaClick: (categoriaId: string) => void;
}

export const CategoriasList = ({ selectedCategoriaId, onCategoriaClick }: CategoriasListProps) => {
  const { data: categorias, isLoading, error } = useCategorias();

  const renderIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return null;
    }

    // Se for um emoji (caracteres Unicode) - regex expandida para cobrir mais emojis
    if (categoria.icone_url.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{20E3}]|[\u{2700}-\u{27BF}]|[\u{24C2}]|[\u{1F170}-\u{1F251}]/u)) {
      return <span className="text-sm">{categoria.icone_url}</span>;
    }

    // Se for uma URL
    return (
      <img 
        src={categoria.icone_url} 
        alt=""
        className="w-4 h-4 object-contain"
        loading="lazy"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (error || !categorias?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categorias.map((categoria) => (
        <Button
          key={categoria.id}
          variant={selectedCategoriaId === categoria.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoriaClick(categoria.id)}
          className="flex-shrink-0 flex items-center gap-2"
        >
          {renderIcon(categoria)}
          {categoria.nome}
        </Button>
      ))}
    </div>
  );
};
