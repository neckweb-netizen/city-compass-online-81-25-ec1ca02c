
import { useState, useEffect, useMemo } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useCategorias } from '@/hooks/useCategorias';
import { useCidades } from '@/hooks/useCidades';

// Função para normalizar texto removendo acentos e convertendo para minúsculas
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos (acentos)
};

export const useSearchSuggestions = (searchTerm: string, maxResults: number = 5) => {
  const [suggestions, setSuggestions] = useState({
    empresas: [],
    categorias: [],
    cidades: []
  });

  const { data: empresas } = useEmpresas();
  const { data: categorias } = useCategorias();
  const { data: cidades } = useCidades();

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return { empresas: [], categorias: [], cidades: [] };
    }

    const normalizedSearch = normalizeText(searchTerm);

    // Filtrar empresas
    const filteredEmpresas = (empresas || [])
      .filter(empresa => 
        normalizeText(empresa.nome).includes(normalizedSearch) ||
        normalizeText(empresa.descricao || '').includes(normalizedSearch) ||
        normalizeText(empresa.endereco || '').includes(normalizedSearch)
      )
      .slice(0, maxResults);

    // Filtrar categorias
    const filteredCategorias = (categorias || [])
      .filter(categoria => 
        normalizeText(categoria.nome).includes(normalizedSearch)
      )
      .slice(0, maxResults);

    // Filtrar cidades
    const filteredCidades = (cidades || [])
      .filter(cidade => 
        normalizeText(cidade.nome).includes(normalizedSearch)
      )
      .slice(0, maxResults);

    return {
      empresas: filteredEmpresas,
      categorias: filteredCategorias,
      cidades: filteredCidades
    };
  }, [searchTerm, empresas, categorias, cidades, maxResults]);

  useEffect(() => {
    setSuggestions(filteredSuggestions);
  }, [filteredSuggestions]);

  return suggestions;
};
