/**
 * LLM Base Provider
 * 
 * Abstract base class for language model providers that standardizes
 * model access, caching, and configuration across different providers.
 */
import type { LanguageModel } from 'ai';
import type { ProviderInfo, ProviderConfig, ModelInfo } from '@/types/provider';
import type { IProviderSetting } from '@/types/model';
import { createOpenAI } from '@ai-sdk/openai';
import { createScopedLogger } from '@/lib/logger';


/**
 * Abstract base class for all LLM providers
 * Provides standardized methods for model access and configuration
 */
export abstract class BaseProvider implements ProviderInfo {
  static providerName: string;
  protected logger: ReturnType<typeof createScopedLogger>;

  constructor() {
    this.logger = createScopedLogger(this.constructor.name);
  }

  abstract name: string;
  abstract staticModels: ModelInfo[];
  abstract config: ProviderConfig;
  cachedDynamicModels?: {
    cacheId: string;
    models: ModelInfo[];
  };

  // Optional properties for provider UI
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;

  protected _convertEnvToRecord(env?: Record<string, unknown>): Record<string, string> {
    if (!env) {
      return {};
    }

    return Object.entries(env).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  getProviderBaseUrlAndKey(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: IProviderSetting;
    serverEnv?: Record<string, string>;
    defaultBaseUrlKey: string;
    defaultApiTokenKey: string;
  }) {
    const { apiKeys, providerSettings, serverEnv, defaultBaseUrlKey, defaultApiTokenKey } = options;
    let settingsBaseUrl = providerSettings?.baseUrl;
    
    this.logger.debug(`${this.name}: Getting provider base URL and key - hasApiKeys: ${!!apiKeys}, hasProviderSettings: ${!!providerSettings}, hasServerEnv: ${!!serverEnv}, defaultBaseUrlKey: ${defaultBaseUrlKey}, defaultApiTokenKey: ${defaultApiTokenKey}`);

    if (settingsBaseUrl && settingsBaseUrl.length == 0) {
      settingsBaseUrl = undefined;
    }

    const baseUrlKey = this.config.baseUrlKey || defaultBaseUrlKey;
    let baseUrl =
      settingsBaseUrl ||
      serverEnv?.[baseUrlKey] ||
      (typeof process !== 'undefined' ? process?.env?.[baseUrlKey] : undefined) ||
      this.config.baseUrl;

    if (baseUrl && baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const apiTokenKey = this.config.apiTokenKey || defaultApiTokenKey;
    const apiKey =
      apiKeys?.[this.name] || 
      serverEnv?.[apiTokenKey] || 
      (typeof process !== 'undefined' ? process?.env?.[apiTokenKey] : undefined);

    const baseUrlSource = settingsBaseUrl ? 'settings' : 
                    serverEnv?.[baseUrlKey] ? 'serverEnv' : 
                    (typeof process !== 'undefined' && process?.env?.[baseUrlKey]) ? 'process.env' : 
                    this.config.baseUrl ? 'config' : 'none';
    const apiKeySource = apiKeys?.[this.name] ? 'apiKeys' : 
                   serverEnv?.[apiTokenKey] ? 'serverEnv' : 
                   (typeof process !== 'undefined' && process?.env?.[apiTokenKey]) ? 'process.env' : 'none';
    
    this.logger.debug(`${this.name}: Provider configuration - hasBaseUrl: ${!!baseUrl}, hasApiKey: ${!!apiKey}, baseUrlSource: ${baseUrlSource}, apiKeySource: ${apiKeySource}`);
    
    return {
      baseUrl,
      apiKey,
    };
  }

  getModelsFromCache(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }): ModelInfo[] | null {
    if (!this.cachedDynamicModels) {
      this.logger.debug(`${this.name}: No cached dynamic models available`);
      return null;
    }

    const cacheKey = this.cachedDynamicModels.cacheId;
    const generatedCacheKey = this.getDynamicModelsCacheKey(options);

    if (cacheKey !== generatedCacheKey) {
      this.logger.debug(`${this.name}: Cache key mismatch`, { cacheKey, generatedCacheKey });
      this.cachedDynamicModels = undefined;
      return null;
    }

    this.logger.debug(`${this.name}: Returning ${this.cachedDynamicModels.models.length} models from cache`);
    return this.cachedDynamicModels.models;
  }

  getDynamicModelsCacheKey(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }) {
    return JSON.stringify({
      apiKeys: options.apiKeys?.[this.name],
      providerSettings: options.providerSettings?.[this.name],
      serverEnv: options.serverEnv,
    });
  }

  storeDynamicModels(
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
    models: ModelInfo[],
  ) {
    const cacheId = this.getDynamicModelsCacheKey(options);

    this.logger.debug(`${this.name}: Caching ${models.length} dynamic models`);
    this.cachedDynamicModels = {
      cacheId,
      models,
    };
  }

  // Declare the optional getDynamicModels method
  getDynamicModels?(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]>;

  /**
   * Abstract method to get a model instance for the provider
   */
  abstract getModelInstance(options: {
    model: string;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel;
}

type OptionalApiKey = string | undefined;

export function getOpenAILikeModel(baseURL: string, apiKey: OptionalApiKey, model: string) {
  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  return openai(model);
}
