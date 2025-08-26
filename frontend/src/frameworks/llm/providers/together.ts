/**
 * Together Provider
 * 
 * Implements the Together.ai language model provider with support for
 * various models available through their API.
 */
import { BaseProvider, getOpenAILikeModel } from '../base-provider';
import type { ModelInfo } from '@/types/provider';
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('TogetherProvider');

interface TogetherModel {
  id: string;
  display_name: string;
  type: string;
  context_length: number;
  pricing: {
    input: number;
    output: number;
  };
}

/**
 * Together Provider implementation
 * Provides access to various LLMs hosted on Together.ai
 */
export default class TogetherProvider extends BaseProvider {
  name = 'Together';
  getApiKeyLink = 'https://api.together.xyz/settings/api-keys';
  labelForGetApiKey = 'Get Together.ai API Key';

  config = {
    baseUrlKey: 'TOGETHER_API_BASE_URL',
    apiTokenKey: 'TOGETHER_API_KEY',
    baseUrl: 'https://api.together.xyz/v1',
  };

  // Static list of popular models available on Together.ai
  staticModels: ModelInfo[] = [
    {
      name: 'Qwen/Qwen2.5-32B-Instruct-Code',
      label: 'Qwen 2.5 32B Instruct Code',
      provider: 'Together',
      maxTokenAllowed: 64000,
    },
    {
      name: 'meta-llama/Llama-3.1-405B-Instruct-Turbo',
      label: 'Llama 3.1 405B Instruct Turbo',
      provider: 'Together',
      maxTokenAllowed: 128000,
    },
    {
      name: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
      label: 'Mixtral 8x22B Instruct',
      provider: 'Together',
      maxTokenAllowed: 64000,
    },
  ];

  /**
   * Dynamically fetches available models from the Together.ai API
   * 
   * @param apiKeys - API keys for providers
   * @param settings - Provider settings
   * @param serverEnv - Server environment variables
   * @returns Array of available models with pricing details
   */
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    logger.debug('Fetching dynamic models from Together.ai API');
    
    const { baseUrl: fetchBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'TOGETHER_API_BASE_URL',
      defaultApiTokenKey: 'TOGETHER_API_KEY',
    });
    
    const baseUrl = fetchBaseUrl || this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      logger.warn('Missing baseUrl or apiKey for Together.ai provider');
      return [];
    }

    try {
      logger.debug(`Fetching models from ${baseUrl}/models`);
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to fetch models - status: ${response.status}, error: ${errorText}`);
        return [];
      }

      const res = (await response.json()) as TogetherModel[];
      
      if (!Array.isArray(res)) {
        logger.error('Invalid response format from Together.ai API', { response: res });
        return [];
      }
      
      // Filter to chat models only
      const chatModels = (res || []).filter((model: TogetherModel) => model.type === 'chat');
      logger.debug(`Retrieved ${chatModels.length} chat models from Together.ai`);

      return chatModels.map((m: TogetherModel) => ({
        name: m.id,
        label: `${m.display_name} - in:$${m.pricing.input.toFixed(2)} out:$${m.pricing.output.toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
        provider: this.name,
        maxTokenAllowed: m.context_length || 8000,
      }));
    } catch (error) {
      logger.error('Error fetching models from Together.ai API', { error });
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
    
    logger.debug(`Getting model instance - model: ${model}, hasServerEnv: ${!!serverEnv}, hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}`);

    const envRecord = this._convertEnvToRecord(serverEnv);

    const { baseUrl: configBaseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'TOGETHER_API_BASE_URL',
      defaultApiTokenKey: 'TOGETHER_API_KEY',
    });

    const baseUrl = configBaseUrl || this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      logger.error(`Missing configuration for ${this.name} model instance`);
      throw new Error(`Missing configuration for ${this.name} provider`);
    }
    
    logger.debug('API key and baseUrl retrieved for model instance');
    logger.debug(`Creating Together.ai instance - model: ${model}, baseUrl: ${baseUrl}`);

    try {
      return getOpenAILikeModel(baseUrl, apiKey, model);
    } catch (error) {
      logger.error(`Error creating Together.ai instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
