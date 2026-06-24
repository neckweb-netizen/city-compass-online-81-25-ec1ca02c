import { useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseCache } from '@/lib/supabaseCache';

interface QueryOptions {
  cacheKey?: string;
  cacheTTL?: number;
}

export const useOptimizedQuery = <T = any>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  options: QueryOptions = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cacheKey = options.cacheKey || `query-${Date.now()}`;
    
    // Check cache first
    const cachedData = supabaseCache.get<T[]>(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      const { data: result, error: queryError } = await queryFn();

      if (queryError) {
        setError(queryError.message);
        return;
      }

      if (result) {
        setData(result);
        // Cache result
        supabaseCache.set(cacheKey, result, options.cacheTTL || 300);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, options]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Clear cache before refetch
    const cacheKey = options.cacheKey || `query-${Date.now()}`;
    supabaseCache.clear();
    fetchData();
  }, [fetchData, options]);

  return { data, loading, error, refetch };
};