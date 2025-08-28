import type { ModelInfo } from '@/types/provider';
import type { IProviderSetting } from '@/types/model';
import { LLMManager } from '@/frameworks/llm/manager';
import type { BaseProvider } from '@/frameworks/llm/base-provider';

const llmManager = LLMManager.getInstance();

export const setLLMApiKey = async (provider: string, apiKey: string) => {
  try {
    const response = await fetch('/api/method/writer.api.set_llm_api_key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        api_key: apiKey,
      }),
    });
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to set LLM API key:', error);
    return { error };
  }
};

export const getLLMApiKey = async (provider: string) => {
  try {
    console.log('Fetching LLM API key for provider:', provider);
    const response = await fetch('/api/method/writer.api.get_llm_api_key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        // Only pass the provider parameter, no additional parameters
      }),
    });
    const data = await response.json()
    console.log('Fetched LLM API key:', data);
    return data
  } catch (error) {
    console.error('Failed to get LLM API key:', error);
    return { error };
  }
};

export async function fetchLLMProviders(): Promise<BaseProvider[]> {
  await llmManager.initialize();
  console.log('Fetching LLM providers from LLMManager...');
  return llmManager.getAllProviders();
};

export const fetchLLMModels = async (
  providerName: string,
  options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  } = {},
): Promise<ModelInfo[]> => {
  console.log(`Fetching LLM models for ${providerName} from LLMManager...`);
  await llmManager.initialize();
  const provider = llmManager.getProvider(providerName);
  if (!provider) {
    console.error(`Provider ${providerName} not found.`);
    return Promise.resolve([]);
  }
  const modelList = await llmManager.getModelListFromProvider(provider, options);
  return modelList;
};

export const fetchDefaultLLMSettings = async () => {
  console.log('Fetching default LLM settings from LLMManager...');
  await llmManager.initialize();
  const defaultProvider = llmManager.getDefaultProvider();
  const defaultModel = defaultProvider.staticModels[0];
  return {
    provider: defaultProvider.name,
    model: defaultModel.name,
  };
};
