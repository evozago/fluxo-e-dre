import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export function useLoading(initialState: LoadingState = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const resetLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    resetLoading,
    loadingStates
  };
}

// Hook específico para operações CRUD
export function useCrudLoading() {
  return useLoading({
    create: false,
    read: false,
    update: false,
    delete: false
  });
}

// Hook para loading de dados de tabela
export function useTableLoading() {
  return useLoading({
    fetch: false,
    refresh: false,
    filter: false,
    sort: false,
    export: false,
    import: false
  });
}

