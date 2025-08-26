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

/**
 * Google Provider implementation for Gemini models
 */
export default class GoogleProvider extends BaseProvider {
  static providerName = 'Google';
  constructor() {
    super();
  }
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

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Google - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Google, returning only static models');
      return [];
    }
    
    this.logger.debug('API key retrieved successfully for Google');
    
    try {
      this.logger.debug('Fetching models from Google AI API');
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        headers: {
          'x-goog-api-key': apiKey,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Google AI API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Google AI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Google AI API returned ${data.models?.length || 0} models`);
      
      if (!data.models || !Array.isArray(data.models)) {
        this.logger.warn('Unexpected response format from Google AI API');
        return [];
      }
      
      // Get static model names to filter them out from dynamic results
      const staticModelNames = this.staticModels.map(model => model.name);
      
      // Transform the API response to our ModelInfo format and filter out static models
      return data.models
        .filter((model: any) => {
          const modelName = model.name.split('/').pop();
          return !staticModelNames.includes(modelName);
        })
        .map((model: any) => {
          const modelName = model.name.split('/').pop();
          return {
            name: modelName,
            label: model.displayName || modelName,
            provider: this.name,
            maxTokenAllowed: model.inputTokenLimit || 8192,
          };
        });
    } catch (error) {
      this.logger.error(`Error fetching Google models: ${error}`);
      // Don't throw here, just return empty array so UI doesn't break
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Record<string, unknown>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    
    this.logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);

    const envRecord = this._convertEnvToRecord(serverEnv);

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Google instance - model: ${model}`);

    try {
      const googleAI = createGoogleGenerativeAI({
        apiKey,
      });

      return googleAI(model);
    } catch (error) {
      this.logger.error(`Error creating Google instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
