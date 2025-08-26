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

/**
 * Cohere Provider implementation for Command models
 */
export default class CohereProvider extends BaseProvider {
  static providerName = 'Cohere';
  constructor() {
    super();
  }
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

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Cohere - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Cohere, returning only static models');
      return [];
    }
    
    this.logger.debug('API key retrieved successfully for Cohere');
    
    try {
      this.logger.debug('Fetching models from Cohere API');
      const response = await fetch('https://api.cohere.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Cohere API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Cohere API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Cohere API returned ${data.models?.length || 0} models`);
      
      if (!data.models || !Array.isArray(data.models)) {
        this.logger.warn('Unexpected response format from Cohere API');
        return [];
      }
      
      // Get static model names to filter them out from dynamic results
      const staticModelNames = this.staticModels.map(model => model.name);
      
      // Transform the API response to our ModelInfo format and filter out static models
      return data.models
        .filter((model: any) => !staticModelNames.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.name || model.id,
          provider: this.name,
          maxTokenAllowed: model.context_window_size || 4096,
        }));
    } catch (error) {
      this.logger.error(`Error fetching Cohere models: ${error}`);
      // Don't throw here, just return empty array so UI doesn't break
      return [];
    }
  }

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
    
    this.logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);

    const envRecord = this._convertEnvToRecord(serverEnv);

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'COHERE_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Cohere instance - model: ${model}`);

    try {
      const cohere = createCohere({
        apiKey,
      });

      return cohere(model);
    } catch (error) {
      this.logger.error(`Error creating Cohere instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
