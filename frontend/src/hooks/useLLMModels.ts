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
  const { provider, apiKeys } = params;
  const llmManager = LLMManager.getInstance();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    // Skip reload if there's no provider selected
    if (!provider) {
      setModels([]);
      return;
    }
    
    const providerInstance = llmManager.getProvider(provider);
    if (!providerInstance) {
      setError(`Provider ${provider} not found`);
      setModels([]);
      return;
    }
    
    // If provider requires an API key but none is available, just clear models and don't show error
    // This is a normal state when switching providers before API key is loaded
    if (providerInstance.config.apiTokenKey && !apiKeys?.[provider]) {
      // Don't set error here, as this is an expected temporary state during provider switching
      setModels([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Reuse the already validated provider instance from above
      const modelList = await llmManager.getModelListFromProvider(providerInstance, { apiKeys });
      setModels(modelList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch models for ${provider}`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider) {
      reload();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKeys]);

  useEffect(() => {
    const handleModelListUpdated = (updatedModels: ModelInfo[]) => {
      setModels(updatedModels.filter((m) => m.provider === provider));
    };

    llmEvents.on('modelListUpdated', handleModelListUpdated);

    return () => {
      llmEvents.off('modelListUpdated', handleModelListUpdated);
    };
  }, [provider]);

  return {
    models,
    isLoading,
    error,
    reload
  };
}
