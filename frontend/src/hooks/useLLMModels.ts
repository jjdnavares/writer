/**
 * LLM Framework - Models Hook
 * 
 * This hook provides a React interface for fetching and managing LLM models for a specific provider.
 * It handles loading state, errors, and caching model data.
 */

import { useState, useEffect } from 'react';
import { LLMManager } from '@/frameworks/llm';
import { llmEvents } from '@/frameworks/llm/events';
import type { ModelInfo } from '@/types/provider';

interface UseLLMModelsParams {
  provider: string;
  apiKeys?: Record<string, string>;
}

/**
 * Hook for fetching and managing LLM models for a specific provider
 * @param params Provider name
 * @returns Model data, loading state, error state, and refresh function
 */
export function useLLMModels(params: UseLLMModelsParams) {
  const { provider } = params;
  const llmManager = LLMManager.getInstance();

    const [models, setModels] = useState<ModelInfo[]>(() =>
    llmManager.getModelList().filter((m: ModelInfo) => m.provider === provider)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!provider) {
      setModels([]);
      return;
    }

    const handleModelListUpdated: (payload: ModelInfo[]) => void = (updatedModels) => {
      setModels(updatedModels.filter((m: ModelInfo) => m.provider === provider));
    };

    llmEvents.on('modelListUpdated', handleModelListUpdated);
    setModels(llmManager.getModelList().filter((m: ModelInfo) => m.provider === provider));

    return () => {
      llmEvents.off('modelListUpdated', handleModelListUpdated);
    };
  }, [provider, llmManager]);

  const reload = async () => {
    if (!provider) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // The model list will be updated via the 'modelListUpdated' event
      // after an API key is provided and models are fetched.
      // This reload function can be used to manually trigger a refresh if needed in the future.
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to fetch models for ${provider}`;
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    models,
    isLoading,
    error,
    reload
  };
}
