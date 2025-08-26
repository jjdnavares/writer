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

/**
 * Mistral Provider implementation
 */
export default class MistralProvider extends BaseProvider {
  static providerName = 'Mistral';
  constructor() {
    super();
  }
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

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Mistral - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Mistral, returning only static models');
      return [];
    }
    
    this.logger.debug('API key retrieved successfully for Mistral');
    
    try {
      this.logger.debug('Fetching models from Mistral API');
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Mistral API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Mistral API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Mistral API returned ${data.data?.length || 0} models`);
      
      if (!data.data || !Array.isArray(data.data)) {
        this.logger.warn('Unexpected response format from Mistral API');
        return [];
      }
      
      // Get static model names to filter them out from dynamic results
      const staticModelNames = this.staticModels.map(model => model.name);
      
      // Transform the API response to our ModelInfo format and filter out static models
      return data.data
        .filter((model: any) => !staticModelNames.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.name || model.id,
          provider: this.name,
          maxTokenAllowed: model.context_window || 8000,
        }));
    } catch (error) {
      this.logger.error(`Error fetching Mistral models: ${error}`);
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
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Mistral instance - model: ${model}`);

    try {
      const mistral = createMistral({
        apiKey,
      });

      return mistral(model);
    } catch (error) {
      this.logger.error(`Error creating Mistral instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
