/**
 * LLM Settings Component
 * 
 * This component handles the LLM provider, model selection, and API key management.
 */

import { useState, useEffect } from 'react';
import { 
  ProviderSelector, 
  ModelSelector, 
  ApiKeyInput 
} from '@/frameworks/llm';
import { llmEvents } from '@/frameworks/llm/events';
import { getLLMApiKey, setLLMApiKey, fetchLLMProviders } from '@/lib/llm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { ProviderInfo } from '@/types/model';
import type { ModelInfo } from '@/types/provider';

interface LLMSettingsProps {
  models: ModelInfo[];
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  isLoadingModels: boolean;
  modelError: string;
  disabled?: boolean;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export function LLMSettings({
  models,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  isLoadingModels,
  modelError,
  disabled = false,
  isExpanded: isExpandedProp,
  setIsExpanded: setIsExpandedProp
}: LLMSettingsProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [providerError, setProviderError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [localIsExpanded, setLocalIsExpanded] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      setIsLoadingProviders(true);
      setProviderError('');
      try {
        const fetchedProviders = await fetchLLMProviders();
        setProviders(fetchedProviders);
      } catch (error) {
        setProviderError('Failed to load providers.');
        console.error(error);
      }
      setIsLoadingProviders(false);
    };
    loadProviders();
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;

    const fetchApiKey = async () => {
      const response = await getLLMApiKey(selectedProvider);
      if (response.error) {
        console.error('Failed to fetch API key:', response.error);
        setApiKeyError('Failed to fetch API key.');
        setApiKey('');
      } else if (response.data?.message?.api_key) {
        setApiKey(response.data.message.api_key);
        setApiKeyError('');
      } else {
        setApiKey('');
      }
    };

    fetchApiKey();
  }, [selectedProvider]);

  const isControlled = isExpandedProp !== undefined && setIsExpandedProp !== undefined;
  const isExpanded = isControlled ? isExpandedProp : localIsExpanded;
  const setIsExpanded = isControlled ? setIsExpandedProp : setLocalIsExpanded;

  const toggleSettings = () => {
    setIsExpanded(!isExpanded);
  };

  const handleApiKeyChange = async (newApiKey: string) => {
    setApiKey(newApiKey);
    if (selectedProvider) {
      const response = await setLLMApiKey(selectedProvider, newApiKey);
      if (response.error) {
        console.error('Failed to save API key:', response.error);
        setApiKeyError('Failed to save API key.');
      } else {
        setApiKeyError('');
        llmEvents.emit('apiKeyUpdated', { 
          providerName: selectedProvider, 
          apiKey: newApiKey 
        });
      }
    }
  };

  const isApiKeyRequired = true; // Simplified for now

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">LLM Provider Settings</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSettings}
            disabled={disabled}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide Settings' : 'Show Settings'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <ProviderSelector 
            providers={providers}
            selectedProvider={selectedProvider}
            onProviderChange={onProviderChange}
            isLoading={isLoadingProviders}
            error={providerError}
            placeholder="Select your AI provider"
          />
          
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            isLoading={isLoadingModels}
            error={modelError}
            disabled={!selectedProvider || disabled}
            placeholder="Select your AI model"
          />
          
          {isApiKeyRequired && (
            <ApiKeyInput
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
              error={apiKeyError}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
