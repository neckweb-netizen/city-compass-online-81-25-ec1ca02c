import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useCategorias } from '@/hooks/useCategorias';
import { useCidades } from '@/hooks/useCidades';
import { LocalCard } from '@/components/locais/LocalCard';
import { BannerSection } from '@/components/home/BannerSection';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

// Função para normalizar texto removendo acentos e convertendo para minúsculas
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos (acentos)
};
export const SearchContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoria') || '');
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('cidade') || '');
  const {
    data: empresas,
    isLoading: empresasLoading,
    isError: empresasError,
    refetch: refetchEmpresas,
  } = useEmpresas();
  const {
    data: categorias,
    isError: categoriasError,
    refetch: refetchCategorias,
  } = useCategorias('empresa');
  const {
    data: cidades,
    isError: cidadesError,
    refetch: refetchCidades,
  } = useCidades();

  const setFilter = (key: 'q' | 'categoria' | 'cidade', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  // Atualizar estados quando os parâmetros de URL mudarem
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('categoria') || '');
    setSelectedCity(searchParams.get('cidade') || '');
  }, [searchParams]);
  const filteredEmpresas = useMemo(() => {
    if (!empresas) return [];
    return empresas.filter(empresa => {
      const matchesSearch = !searchTerm || normalizeText(empresa.nome).includes(normalizeText(searchTerm)) || normalizeText(empresa.descricao || '').includes(normalizeText(searchTerm));
      const matchesCategory = !selectedCategory || empresa.categoria_id === selectedCategory;
      const matchesCity = !selectedCity || selectedCity === 'all' || empresa.cidade_id === selectedCity;
      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [empresas, searchTerm, selectedCategory, selectedCity]);
  const renderCategoryIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return null;
    }

    // Se for um emoji (caracteres Unicode) - regex expandida para cobrir mais emojis
    if (categoria.icone_url.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{20E3}]|[\u{2700}-\u{27BF}]|[\u{24C2}]|[\u{1F170}-\u{1F251}]/u)) {
      return <span className="text-xs">{categoria.icone_url}</span>;
    }

    // Se for uma URL
    return <img src={categoria.icone_url} alt="" className="w-3 h-3 object-contain" loading="lazy" />;
  };
  return <div className="container mx-auto px-4 py-8">
      {/* Banner publicitário - seção busca */}
      <BannerSection secao="busca" />
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Buscar Locais</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Encontre os melhores locais e serviços da sua região
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input type="search" aria-label="Buscar locais" placeholder="Digite o nome do local ou serviço..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setFilter('q', e.target.value); }} className="pl-12 h-12 text-lg" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Categorias</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!selectedCategory} aria-label="Todas as categorias" onClick={() => { setSelectedCategory(''); setFilter('categoria', ''); }}>
                <Badge variant={selectedCategory === '' ? "default" : "outline"} className="cursor-pointer">Todas</Badge>
              </button>
              {categorias?.map(categoria => <button key={categoria.id} type="button" aria-pressed={selectedCategory === categoria.id} onClick={() => { setSelectedCategory(categoria.id); setFilter('categoria', categoria.id); }} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Badge variant={selectedCategory === categoria.id ? "default" : "outline"} className="cursor-pointer flex items-center gap-1">
                  {renderCategoryIcon(categoria)}
                  {categoria.nome}
                </Badge>
              </button>)}
            </div>
          </div>

          <div className="w-full md:max-w-xs">
            <label htmlFor="search-city" className="mb-2 block text-sm font-medium">Cidade</label>
            <Select value={selectedCity || 'all'} onValueChange={value => { setSelectedCity(value === 'all' ? '' : value); setFilter('cidade', value); }}>
              <SelectTrigger id="search-city" aria-label="Filtrar por cidade">
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cidades?.map(cidade => <SelectItem key={cidade.id} value={cidade.id}>{cidade.nome}, {cidade.estado}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {(empresasError || categoriasError || cidadesError) ? (
        <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-xl border p-6 text-center">
          <p>Não foi possível carregar a busca. Verifique sua conexão e tente novamente.</p>
          <button type="button" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { void refetchEmpresas(); void refetchCategorias(); void refetchCidades(); }}>Tentar novamente</button>
        </div>
      ) : empresasLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>)}
        </div> : <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredEmpresas.length} {filteredEmpresas.length === 1 ? 'local encontrado' : 'locais encontrados'}
            </p>
          </div>

          {filteredEmpresas.length === 0 ? <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum local encontrado com os filtros aplicados.
              </p>
            </div> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmpresas.map(empresa => <LocalCard key={empresa.id} empresa={empresa} />)}
            </div>}
        </>}
    </div>;
};