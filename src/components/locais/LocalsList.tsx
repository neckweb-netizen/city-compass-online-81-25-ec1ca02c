
import { useEmpresas } from '@/hooks/useEmpresas';
import { useCidadeData } from '@/hooks/useCidadePadrao';
import { LocalCard } from './LocalCard';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Grid, List } from 'lucide-react';

interface LocaisListProps {
  categoriaId?: string;
  searchTerm?: string;
  title?: string;
}

export const LocalsList = ({ categoriaId, searchTerm, title }: LocaisListProps) => {
  const { cidade } = useCidadeData();
  const { data: locais, isLoading } = useEmpresas(cidade?.id, categoriaId);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState('');

  const filteredLocais = locais?.filter(local => {
    const searchQuery = searchTerm || localSearch;
    if (!searchQuery) return true;
    
    return local.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
           local.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           local.categorias?.nome.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredLocais || filteredLocais.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum local encontrado
          </h3>
          <p className="text-gray-600">
            {searchTerm || localSearch 
              ? 'Tente ajustar sua busca ou filtros.'
              : 'Não há locais cadastrados nesta categoria ainda.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          )}
          <p className="text-gray-600">
            {filteredLocais.length} local{filteredLocais.length !== 1 ? 'is' : ''} encontrado{filteredLocais.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="grid min-w-0 w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-2xl">
          {/* Busca local (se não há searchTerm props) */}
          {!searchTerm && (
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar locais..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full min-w-0 pl-10"
              />
            </div>
          )}
          
          {/* Controles de visualização */}
          <div className="flex min-w-0 items-center justify-end gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Visualização em grade</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Visualização em lista</span>
            </Button>
            <Button variant="outline" size="sm" className="min-w-0">
              <Filter className="mr-2 h-4 w-4" />
              <span>Filtros</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de locais */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }>
        {filteredLocais.map((local) => (
          <LocalCard
            key={local.id}
            empresa={local}
            onClick={() => navigate(`/locais/${local.slug || local.id}`)}
          />
        ))}
      </div>
    </div>
  );
};
