
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonCard } from '@/components/ui/neon-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const suggestions = useSearchSuggestions(searchTerm, 5);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (type: 'empresa' | 'categoria' | 'cidade', item: any) => {
    if (type === 'empresa') {
      navigate(`/local/${item.slug || item.id}`);
    } else if (type === 'categoria') {
      navigate(`/search?categoria=${item.id}`);
    } else if (type === 'cidade') {
      navigate(`/search?cidade=${item.id}`);
    }
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      <NeonCard className="p-1 max-w-2xl mx-auto">
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar empresas, produtos ou serviços..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="pl-10 pr-4 py-3 text-base border-0 focus:border-0 focus:ring-0 rounded-lg shadow-sm bg-background/80 backdrop-blur-sm"
                autoComplete="off"
              />
            </div>
          </form>
          
          <SearchSuggestions
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isVisible={showSuggestions}
          />
        </div>
      </NeonCard>
    </section>
  );
};
