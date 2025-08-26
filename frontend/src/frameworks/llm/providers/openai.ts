/**
 * OpenAI Provider
 * 
 * Implements the OpenAI language model provider with support for
 * static and dynamic model retrieval.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createOpenAI } from '@ai-sdk/openai';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('OpenAIProvider');

interface OpenAIModel {
  id: string;
  object: string;
  context_window?: number;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

/**
 * OpenAI Provider implementation
 */
export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';
  labelForGetApiKey = 'Get OpenAI API Key';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokenAllowed: 4096 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    logger.debug(`Getting dynamic models - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      logger.error('Missing API key configuration');
      throw `Missing Api Key configuration for ${this.name} provider`;
    }
    
    logger.debug('API key retrieved successfully');

    let filteredModels: OpenAIModel[] = [];
    
    try {
      logger.debug('Fetching models from OpenAI API');
      const response = await fetch(`https://api.openai.com/v1/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenAI API request failed - status: ${response.status}, statusText: ${response.statusText}, error: ${errorText}`);
        throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const res = (await response.json()) as OpenAIModelsResponse;
      logger.debug(`OpenAI API response received - modelCount: ${res.data?.length || 0}`);
      
      const staticModelIds = this.staticModels.map((m) => m.name);

      filteredModels = res.data.filter(
        (model: OpenAIModel) =>
          model.object === 'model' &&
          (model.id.startsWith('gpt-') || model.id.startsWith('o') || model.id.startsWith('chatgpt-')) &&
          !staticModelIds.includes(model.id),
      );
      
      logger.debug(`Filtered models - count: ${filteredModels.length}`);
    } catch (error) {
      logger.error(`Error fetching models from OpenAI API - error: ${error}`);
      throw error;
    }

    const mappedModels = filteredModels.map((m: OpenAIModel) => ({
      name: m.id,
      label: `${m.id}`,
      provider: this.name,
      maxTokenAllowed: m.context_window || 32000,
    }));
    
    logger.debug(`Returning mapped models - count: ${mappedModels.length}`);
    return mappedModels;
  }

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
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    logger.debug('API key retrieved for model instance');

    logger.debug(`Creating OpenAI instance - model: ${model}`);
    try {
      const openai = createOpenAI({
        apiKey,
      });

      return openai(model);
    } catch (error) {
      logger.error(`Error creating OpenAI instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
