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

/**
 * Groq Provider implementation
 */
export default class GroqProvider extends BaseProvider {
  static providerName = 'Groq';
  constructor() {
    super();
  }
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

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Groq - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'GROQ_BASE_URL',
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Groq, returning only static models');
      return [];
    }
    
    const actualBaseUrl = baseUrl || this.config.baseUrl;
    this.logger.debug(`API key retrieved successfully for Groq, using baseUrl: ${actualBaseUrl}`);
    
    try {
      this.logger.debug('Fetching models from Groq API');
      const response = await fetch(`${actualBaseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Groq API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Groq API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Groq API returned ${data.data?.length || 0} models`);
      
      if (!data.data || !Array.isArray(data.data)) {
        this.logger.warn('Unexpected response format from Groq API');
        return [];
      }
      
      // Get static model names to filter them out from dynamic results
      const staticModelNames = this.staticModels.map(model => model.name);
      
      // Transform the API response to our ModelInfo format and filter out static models
      return data.data
        .filter((model: any) => !staticModelNames.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.id,
          provider: this.name,
          maxTokenAllowed: model.context_window_size || 8192,
        }));
    } catch (error) {
      this.logger.error(`Error fetching Groq models: ${error}`);
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

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'GROQ_BASE_URL',
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    const actualBaseUrl = baseUrl || this.config.baseUrl;
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Groq instance - model: ${model}, baseUrl: ${actualBaseUrl}`);

    try {
      return getOpenAILikeModel(actualBaseUrl, apiKey, model);
    } catch (error) {
      this.logger.error(`Error creating Groq instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
