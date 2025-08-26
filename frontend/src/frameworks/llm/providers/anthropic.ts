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
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('AnthropicProvider');

/**
 * Anthropic Provider implementation for Claude models
 */
export default class AnthropicProvider extends BaseProvider {
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

  getModelInstance(options: {
    model: string;
    serverEnv?: Record<string, unknown>;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    
    logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);
    
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
        logger.error('Missing API key for model instance');
        throw new Error(`Missing API key for ${this.name} provider`);
      }
      
      logger.debug('API key retrieved for model instance');
      logger.debug(`Creating Anthropic instance - model: ${model}`);
      
      const anthropic = createAnthropic({
        apiKey,
      });

      return anthropic(model);
    } catch (error) {
      logger.error(`Error creating Anthropic instance - model: ${model}, error: ${error}`);
      throw error;
    }
  };
}
