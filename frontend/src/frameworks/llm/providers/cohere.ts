/**
 * Cohere Provider
 * 
 * Implements the Cohere language model provider with support for
 * Command models and API integration.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createCohere } from '@ai-sdk/cohere';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('CohereProvider');

/**
 * Cohere Provider implementation for Command models
 */
export default class CohereProvider extends BaseProvider {
  name = 'Cohere';
  getApiKeyLink = 'https://dashboard.cohere.com/api-keys';
  labelForGetApiKey = 'Get Cohere API Key';

  config = {
    apiTokenKey: 'COHERE_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'command-r-plus', label: 'Command R+', provider: 'Cohere', maxTokenAllowed: 128000 },
    { name: 'command-r', label: 'Command R', provider: 'Cohere', maxTokenAllowed: 128000 },
    { name: 'command', label: 'Command', provider: 'Cohere', maxTokenAllowed: 4096 },
    { name: 'command-nightly', label: 'Command Nightly', provider: 'Cohere', maxTokenAllowed: 8192 },
    { name: 'command-light', label: 'Command Light', provider: 'Cohere', maxTokenAllowed: 4096 },
    { name: 'command-light-nightly', label: 'Command Light Nightly', provider: 'Cohere', maxTokenAllowed: 8192 },
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
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    logger.debug('API key retrieved for model instance');
    logger.debug(`Creating Cohere instance - model: ${model}`);

    try {
      const cohere = createCohere({
        apiKey,
      });

      return cohere(model);
    } catch (error) {
      logger.error(`Error creating Cohere instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
