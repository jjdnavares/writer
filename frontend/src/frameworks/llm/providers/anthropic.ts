/**
 * Anthropic Provider
 * 
 * Implements the Anthropic language model provider with support for
 * Claude models and API integration.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Anthropic Provider implementation for Claude models
 */
export default class AnthropicProvider extends BaseProvider {
  static providerName = 'Anthropic';
  constructor() {
    super();
  }
  name = 'Anthropic';
  getApiKeyLink = 'https://console.anthropic.com/settings/keys';
  labelForGetApiKey = 'Get Anthropic API Key';

  config = {
    apiTokenKey: 'ANTHROPIC_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'claude-3-5-sonnet-20240620',
      label: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-opus-20240229',
      label: 'Claude 3 Opus',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-sonnet-20240229',
      label: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
    {
      name: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku',
      provider: 'Anthropic',
      maxTokenAllowed: 8000,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    this.logger.debug(`Getting dynamic models for Anthropic - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    if (!apiKey) {
      this.logger.warn('No API key available for Anthropic, returning only static models');
      return [];
    }
    
    this.logger.debug('API key retrieved successfully for Anthropic');
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.logger.debug('Running in browser environment - using server proxy for Anthropic API');
      
      try {
        const response = await fetch('/api/method/writer.api_proxy.anthropic_models');
        
        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Anthropic API proxy request failed - status: ${response.status}, error: ${errorText}`);
          return [];
        }
        
        const data = await response.json();
        this.logger.debug(`Received proxy response: ${JSON.stringify(data).substring(0, 200)}...`);
        
        // Frappe wraps our response in a message property
        // The Anthropic API response has models in data array within the message
        const models = data.message?.data;
        
        if (!models || !Array.isArray(models)) {
          this.logger.warn('Unexpected response format from Anthropic API proxy');
          this.logger.debug(`Full response: ${JSON.stringify(data)}`);
          return [];
        }
        
        // Get static model names to filter them out from dynamic results
        const staticModelNames = this.staticModels.map(model => model.name);
        
        // Transform the API response to our ModelInfo format
        return models
          .filter((model: any) => !staticModelNames.includes(model.id))
          .map((model: any) => ({
            name: model.id,
            label: model.display_name || model.id,
            provider: this.name,
            maxTokenAllowed: 8000, // Anthropic API doesn't return context_window in the models endpoint
          }));
      } catch (error) {
        this.logger.error(`Error fetching Anthropic models via proxy: ${error}`);
        return [];
      }
    }
    
    try {
      this.logger.debug('Fetching models from Anthropic API');
      
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Anthropic API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.logger.debug(`Anthropic API returned ${data.models?.length || 0} models`);
      
      if (!data.models || !Array.isArray(data.models)) {
        this.logger.warn('Unexpected response format from Anthropic API');
        return [];
      }
      
      // Get static model names to filter them out from dynamic results
      const staticModelNames = this.staticModels.map(model => model.name);
      
      // Transform the API response to our ModelInfo format
      // Filter out any models that are already in our static list
      return data.models
        .filter((model: any) => !staticModelNames.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.name || model.id,
          provider: this.name,
          maxTokenAllowed: model.context_window || 8000,
        }));
    } catch (error) {
      this.logger.error(`Error fetching Anthropic models: ${error}`);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Record<string, unknown>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    
    this.logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);
    
    try {
      const envRecord = this._convertEnvToRecord(serverEnv);

      const { apiKey } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: providerSettings?.[this.name],
        serverEnv: envRecord,
        defaultBaseUrlKey: '',
        defaultApiTokenKey: 'ANTHROPIC_API_KEY',
      });
      
      if (!apiKey) {
        this.logger.error('Missing API key for model instance');
        throw new Error(`Missing API key for ${this.name} provider`);
      }
      
      this.logger.debug('API key retrieved for model instance');
      this.logger.debug(`Creating Anthropic instance - model: ${model}`);
      
      const anthropic = createAnthropic({
        apiKey,
      });

      return anthropic(model);
    } catch (error) {
      this.logger.error(`Error creating Anthropic instance - model: ${model}, error: ${error}`);
      throw error;
    }
  };
}
