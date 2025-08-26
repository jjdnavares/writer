/**
 * Groq Provider
 * 
 * Implements the Groq language model provider with support for
 * LLama and other models available through their API.
 */
import { BaseProvider, getOpenAILikeModel } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('GroqProvider');

/**
 * Groq Provider implementation
 */
export default class GroqProvider extends BaseProvider {
  name = 'Groq';
  getApiKeyLink = 'https://console.groq.com/keys';
  labelForGetApiKey = 'Get Groq API Key';

  config = {
    apiTokenKey: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
  };

  staticModels: ModelInfo[] = [
    { name: 'llama3-8b-8192', label: 'LLaMA-3 8B', provider: 'Groq', maxTokenAllowed: 8192 },
    { name: 'llama3-70b-8192', label: 'LLaMA-3 70B', provider: 'Groq', maxTokenAllowed: 8192 },
    { name: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', provider: 'Groq', maxTokenAllowed: 32768 },
    { name: 'gemma-7b-it', label: 'Gemma 7B', provider: 'Groq', maxTokenAllowed: 8192 },
  ];

  /**
   * Creates a model instance for use with the AI SDK
   * 
   * @param options - Model options including model name and API keys
   * @returns Language model instance
   */
  getModelInstance(options: {
    model: string;
    serverEnv?: Record<string, unknown>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    
    logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);

    const envRecord = this._convertEnvToRecord(serverEnv);

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'GROQ_BASE_URL',
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    const actualBaseUrl = baseUrl || this.config.baseUrl;
    
    logger.debug('API key retrieved for model instance');
    logger.debug(`Creating Groq instance - model: ${model}, baseUrl: ${actualBaseUrl}`);

    try {
      return getOpenAILikeModel(actualBaseUrl, apiKey, model);
    } catch (error) {
      logger.error(`Error creating Groq instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
