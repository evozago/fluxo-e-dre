import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

/**
 * Hook para cache local com TTL (Time To Live)
 * Útil para cachear dados que não mudam frequentemente
 */
export function useLocalCache<T>(
  key: string,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // Default: 5 minutes TTL, 100 items max
  
  const [cache, setCache] = useState<Map<string, CacheItem<T>>>(new Map());

  // Limpar itens expirados
  const cleanExpiredItems = useCallback(() => {
    const now = Date.now();
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      for (const [key, item] of newCache.entries()) {
        if (item.expiresAt < now) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  }, []);

  // Limpar cache quando exceder o tamanho máximo
  const enforceMaxSize = useCallback(() => {
    setCache(prevCache => {
      if (prevCache.size <= maxSize) return prevCache;
      
      const entries = Array.from(prevCache.entries());
      // Manter apenas os itens mais recentes
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      return new Map(entries.slice(0, maxSize));
    });
  }, [maxSize]);

  // Obter item do cache
  const get = useCallback((cacheKey: string): T | null => {
    const item = cache.get(cacheKey);
    if (!item) return null;
    
    if (item.expiresAt < Date.now()) {
      // Item expirado, remover do cache
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(cacheKey);
        return newCache;
      });
      return null;
    }
    
    return item.data;
  }, [cache]);

  // Definir item no cache
  const set = useCallback((cacheKey: string, data: T) => {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(cacheKey, item);
      return newCache;
    });
  }, [ttl]);

  // Remover item do cache
  const remove = useCallback((cacheKey: string) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(cacheKey);
      return newCache;
    });
  }, []);

  // Limpar todo o cache
  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  // Verificar se item existe no cache
  const has = useCallback((cacheKey: string): boolean => {
    const item = cache.get(cacheKey);
    if (!item) return false;
    
    if (item.expiresAt < Date.now()) {
      // Item expirado
      remove(cacheKey);
      return false;
    }
    
    return true;
  }, [cache, remove]);

  // Limpeza automática de itens expirados
  useEffect(() => {
    const interval = setInterval(cleanExpiredItems, 60000); // Limpar a cada minuto
    return () => clearInterval(interval);
  }, [cleanExpiredItems]);

  // Aplicar limite de tamanho
  useEffect(() => {
    enforceMaxSize();
  }, [cache.size, enforceMaxSize]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    size: cache.size
  };
}

/**
 * Hook para cache de dados com fetch automático
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) {
  const { enabled = true, ...cacheOptions } = options;
  const cache = useLocalCache<T>(key, cacheOptions);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Verificar cache primeiro
    if (!forceRefresh) {
      const cachedData = cache.get(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.set(key, result);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache, enabled]);

  // Fetch inicial
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate: () => cache.remove(key)
  };
}

