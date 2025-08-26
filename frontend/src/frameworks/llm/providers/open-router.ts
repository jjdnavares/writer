/**
 * Open Router Provider
 * 
 * Implements the Open Router language model provider, which offers a unified API
 * to access various AI models from different providers through a single interface.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';


/**
 * Model information structure from Open Router API
 */
interface OpenRouterModel {
  name: string;
  id: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

/**
 * API response structure from Open Router
 */
interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Open Router Provider implementation
 * Provides access to multiple LLMs through a unified API
 */
export default class OpenRouterProvider extends BaseProvider {
  static providerName = 'OpenRouter';
  constructor() {
    super();
  }
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/settings/keys';
  labelForGetApiKey = 'Get Open Router API Key';

  config = {
    apiTokenKey: 'OPEN_ROUTER_API_KEY',
  };

  // Popular models available through Open Router
  staticModels: ModelInfo[] = [
    {
      name: 'anthropic/claude-3.5-sonnet',
      label: 'Anthropic: Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic/claude-3-haiku',
      label: 'Anthropic: Claude 3 Haiku',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },
    {
      name: 'google/gemini-flash-1.5',
      label: 'Google Gemini Flash 1.5',
      provider: 'OpenRouter',
      maxTokenAllowed: 1000000,
    },
    {
      name: 'google/gemini-pro-1.5',
      label: 'Google Gemini Pro 1.5',
      provider: 'OpenRouter',
      maxTokenAllowed: 1000000,
    },
    { 
      name: 'mistralai/mistral-nemo',
      label: 'Mistral Nemo',
      provider: 'OpenRouter',
      maxTokenAllowed: 128000,
    },
  ];

  /**
   * Dynamically fetches available models from the Open Router API
   * Including pricing information and context window sizes
   * 
   * @param _apiKeys - API keys for providers (not needed for model listing)
   * @param _settings - Provider settings (not needed for model listing)
   * @param _serverEnv - Server environment variables (not needed for model listing)
   * @returns Array of available models with pricing details
   */
  async getDynamicModels(): Promise<ModelInfo[]> {
    this.logger.debug('Fetching dynamic models from Open Router API');
    
    try {
      this.logger.debug('Requesting models from https://openrouter.ai/api/v1/models');
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to fetch models - status: ${response.status}, error: ${errorText}`);
        return [];
      }

      const data = (await response.json()) as OpenRouterModelsResponse;
      
      if (!data.data || !Array.isArray(data.data)) {
        this.logger.error('Invalid response format from Open Router API', { response: data });
        return [];
      }
      
      this.logger.debug(`Retrieved ${data.data.length} models from Open Router`);

      // Sort alphabetically and format with pricing information
      return data.data
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((m) => ({
          name: m.id,
          label: `${m.name} - in:$${(m.pricing.prompt * 1_000_000).toFixed(2)} out:$${(m.pricing.completion * 1_000_000).toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
          provider: this.name,
          maxTokenAllowed: m.context_length || 8000,
        }));
    } catch (error) {
      this.logger.error('Error fetching models from Open Router API', { error });
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
      defaultApiTokenKey: 'OPEN_ROUTER_API_KEY',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');
    this.logger.debug(`Creating Open Router instance - model: ${model}`);

    try {
      const openRouter = createOpenRouter({
        apiKey,
      });
      
      const instance = openRouter.chat(model) as LanguageModel;
      return instance;
    } catch (error) {
      this.logger.error(`Error creating Open Router instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
