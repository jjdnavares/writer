/**
 * Mistral Provider
 * 
 * Implements the Mistral language model provider with support for
 * their models and API integration.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createMistral } from '@ai-sdk/mistral';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('MistralProvider');

/**
 * Mistral Provider implementation
 */
export default class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';
  labelForGetApiKey = 'Get Mistral API Key';

  config = {
    apiTokenKey: 'MISTRAL_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'mistral-large-latest', label: 'Mistral Large', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'mistral-medium-latest', label: 'Mistral Medium', provider: 'Mistral', maxTokenAllowed: 8192 },
    { name: 'mistral-small-latest', label: 'Mistral Small', provider: 'Mistral', maxTokenAllowed: 4096 },
    { name: 'open-mistral-7b', label: 'Open Mistral 7B', provider: 'Mistral', maxTokenAllowed: 4096 },
    { name: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B', provider: 'Mistral', maxTokenAllowed: 4096 },
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

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    logger.debug('API key retrieved for model instance');
    logger.debug(`Creating Mistral instance - model: ${model}`);

    try {
      const mistral = createMistral({
        apiKey,
      });

      return mistral(model);
    } catch (error) {
      logger.error(`Error creating Mistral instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
