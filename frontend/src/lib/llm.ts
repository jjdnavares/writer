import { FrappeApp } from 'frappe-js-sdk';
import type { ModelInfo } from '@/types/provider';
import type { IProviderSetting, ProviderInfo } from '@/types/model';
import { LLMManager } from '@/frameworks/llm/manager';

const frappe = new FrappeApp('http://localhost:8000');
const call = frappe.call();
const llmManager = LLMManager.getInstance();

export const setLLMApiKey = async (provider: string, apiKey: string) => {
  try {
    return await call.post('writer.api.set_llm_api_key', {
      provider,
      api_key: apiKey,
    });
  } catch (error) {
    console.error('Failed to set LLM API key:', error);
    return { error };
  }
};

export const getLLMApiKey = async (provider: string) => {
  try {
    return await call.get('writer.api.get_llm_api_key', {
      provider,
    });
  } catch (error) {
    console.error('Failed to get LLM API key:', error);
    return { error };
  }
};

export async function fetchLLMProviders(): Promise<ProviderInfo[]> {
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
