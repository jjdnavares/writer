/**
 * LLM Framework - Provider Hook
 * 
 * This hook provides a React interface for fetching and managing LLM providers.
 * It handles loading state, errors, and caching provider data.
 */

import { useState, useEffect } from 'react';
import { fetchLLMProviders } from '@/lib/llm';
import type { ProviderInfo } from '@/types/model';

/**
 * Hook for fetching and managing LLM providers
 * @returns Provider data, loading state, error state, and refresh function
 */
export function useLLMProviders() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProviders = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await fetchLLMProviders();
      setProviders(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch LLM providers';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadProviders();
    };
    load();
  }, []);

  return {
    providers,
    isLoading,
    error,
    reload: loadProviders
  };
}
