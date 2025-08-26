/**
 * Perplexity Provider
 * 
 * Implements the Perplexity language model provider with support for
 * Sonar models via their API.
 */
import { BaseProvider, getOpenAILikeModel } from '../base-provider';
import type { ModelInfo } from '@/types/provider';
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('PerplexityProvider');

/**
 * Perplexity Provider implementation
 * Provides access to Perplexity's Sonar models
 */
export default class PerplexityProvider extends BaseProvider {
  name = 'Perplexity';
  getApiKeyLink = 'https://www.perplexity.ai/settings/api';
  labelForGetApiKey = 'Get Perplexity API Key';

  config = {
    apiTokenKey: 'PERPLEXITY_API_KEY',
    baseUrl: 'https://api.perplexity.ai/',
  };

  // Static list of available Sonar models
  staticModels: ModelInfo[] = [
    {
      name: 'llama-3.1-sonar-small-128k-online',
      label: 'Sonar Small Online',
      provider: 'Perplexity',
      maxTokenAllowed: 128000,
    },
    {
      name: 'llama-3.1-sonar-large-128k-online',
      label: 'Sonar Large Online',
      provider: 'Perplexity',
      maxTokenAllowed: 128000,
    },
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
      defaultApiTokenKey: 'PERPLEXITY_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    logger.debug('API key retrieved for model instance');
    logger.debug(`Creating Perplexity instance - model: ${model}`);

    try {
      return getOpenAILikeModel(this.config.baseUrl, apiKey, model);
    } catch (error) {
      logger.error(`Error creating Perplexity instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
