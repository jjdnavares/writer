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

/**
 * Perplexity Provider implementation
 * Provides access to Perplexity's Sonar models
 */
export default class PerplexityProvider extends BaseProvider {
  static providerName = 'Perplexity';
  constructor() {
    super();
  }
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
   * Dynamically fetches available models from the Perplexity API
   * 
   * @param apiKeys - API keys for providers
   * @param settings - Provider settings
   * @param serverEnv - Server environment variables
   * @returns Array of available models
   */
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Perplexity - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'PERPLEXITY_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Perplexity, returning only static models');
      return [];
    }
    
    this.logger.debug('API key retrieved successfully for Perplexity');
    
    try {
      this.logger.debug('Fetching models from Perplexity API');
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Perplexity API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Perplexity API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Perplexity API returned ${data.data?.length || 0} models`);
      
      if (!data.data || !Array.isArray(data.data)) {
        this.logger.warn('Unexpected response format from Perplexity API');
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
          maxTokenAllowed: model.context_length || 128000,
        }));
    } catch (error) {
      this.logger.error(`Error fetching Perplexity models: ${error}`);
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
      defaultApiTokenKey: 'PERPLEXITY_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Perplexity instance - model: ${model}`);

    try {
      return getOpenAILikeModel(this.config.baseUrl, apiKey, model);
    } catch (error) {
      this.logger.error(`Error creating Perplexity instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
