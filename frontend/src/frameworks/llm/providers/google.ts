/**
 * Google Provider
 * 
 * Implements the Google language model provider with support for
 * Gemini models and API integration.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('GoogleProvider');

/**
 * Google Provider implementation for Gemini models
 */
export default class GoogleProvider extends BaseProvider {
  name = 'Google';
  getApiKeyLink = 'https://aistudio.google.com/app/apikey';
  labelForGetApiKey = 'Get Google AI API Key';

  config = {
    apiTokenKey: 'GOOGLE_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: 'Google', maxTokenAllowed: 2048 },
  ];

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
      defaultApiTokenKey: 'GOOGLE_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    logger.debug('API key retrieved for model instance');
    logger.debug(`Creating Google instance - model: ${model}`);

    try {
      const googleAI = createGoogleGenerativeAI({
        apiKey,
      });

      return googleAI(model);
    } catch (error) {
      logger.error(`Error creating Google instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
