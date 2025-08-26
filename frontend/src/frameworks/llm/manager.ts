/**
 * LLM Manager
 * 
 * Singleton class that manages LLM providers and models,
 * providing centralized access to language model functionality.
 */
import type { IProviderSetting } from '@/types/model';
import { BaseProvider } from './base-provider';
import type { ModelInfo } from '@/types/provider';
import { providers } from './registry';
import { createScopedLogger } from '@/lib/logger';
import { llmEvents } from './events';

const logger = createScopedLogger('LLMManager');

/**
 * Singleton class that manages all language model providers
 */
export class LLMManager {
  private static _instance: LLMManager | undefined;
  private _providers: Map<string, BaseProvider> = new Map();
  private _modelList: ModelInfo[] = [];
  private readonly _env: Record<string, string> = {};
  private _boundApiKeyHandler: (data: { providerName: string; apiKey: string }) => Promise<void>;

  private constructor(_env: Record<string, string> = {}) {
    this._env = _env;
    this._boundApiKeyHandler = this.handleApiKeyUpdated.bind(this);
    llmEvents.on('apiKeyUpdated', this._boundApiKeyHandler);
  }

  static resetInstance() {
    if (LLMManager._instance) {
      LLMManager._instance.destroy();
      LLMManager._instance = undefined;
    }
  }

  destroy() {
    llmEvents.off('apiKeyUpdated', this._boundApiKeyHandler);
  }

  /**
   * (For testing purposes only)
   * Overwrites the current providers with a new set.
   * @param providers A map of provider instances.
   */
  _setProviders(providers: Map<string, BaseProvider>) {
    this._providers = providers;
    this._initializeModelList();
  }

  async initialize() {
    if (this._providers.size === 0) {
      await this._registerProvidersFromDirectory();
    }
  }

  static getInstance(env: Record<string, string> = {}): LLMManager {
    if (!LLMManager._instance) {
      LLMManager._instance = new LLMManager(env);
    }

    return LLMManager._instance;
  }
  
  get env() {
    return this._env;
  }

  private async _registerProvidersFromDirectory(): Promise<void> {
    try {
      for (const ProviderClass of Object.values(providers)) {
        if (typeof ProviderClass === 'function' && ProviderClass.prototype instanceof BaseProvider) {
          const provider = new ProviderClass();
          try {
            this.registerProvider(provider);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn('Failed To Register Provider: ', provider.name, 'error:', message);
          }
        }
      }
      this._initializeModelList();
    } catch (error) {
      logger.error('Error registering providers:', error);
    }
  }

  registerProvider(provider: BaseProvider) {
    if (this._providers.has(provider.name)) {
      logger.warn(`Provider ${provider.name} is already registered. Skipping.`);
      return;
    }

    logger.info('Registering Provider: ', provider.name);
    this._providers.set(provider.name, provider);
  }

  getProvider(name: string): BaseProvider | undefined {
    return this._providers.get(name);
  }

  getDefaultProvider(): BaseProvider {
    const openAIProvider = this.getProvider('OpenAI');
    if (openAIProvider) return openAIProvider;

    const googleProvider = this.getProvider('Google');
    if (googleProvider) return googleProvider;

    const anthropicProvider = this.getProvider('Anthropic');
    if (anthropicProvider) return anthropicProvider;

    const firstProvider = this.getAllProviders()[0];
    if (firstProvider) return firstProvider;

    throw new Error('No LLM providers available');
  }

  getAllProviders(): BaseProvider[] {
    return Array.from(this._providers.values());
  }

  getModelList(): ModelInfo[] {
    return this._modelList;
  }

  private async handleApiKeyUpdated(data: { providerName: string; apiKey: string }): Promise<void> {
    const { providerName, apiKey } = data;
    const provider = this.getProvider(providerName);

    if (!provider || !provider.getDynamicModels) {
      return;
    }

    const { apiTokenKey } = provider.config;

    if (!apiTokenKey) {
      logger.warn(`No apiTokenKey configured for provider: ${providerName}`);
      return;
    }

    try {
      const dynamicModels = await provider.getDynamicModels({ [apiTokenKey]: apiKey });
      if (dynamicModels.length > 0) {
        this.updateModelListWithDynamicModels(providerName, dynamicModels);
        llmEvents.emit('modelListUpdated', this._modelList);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching dynamic models for ${providerName}:`, message);
    }
  }

  private _initializeModelList() {
    this._modelList = this.getStaticModelList();
    this._modelList.sort((a, b) => a.name.localeCompare(b.name));
  }

  private updateModelListWithDynamicModels(providerName: string, dynamicModels: ModelInfo[]) {
    const staticModels = this.getStaticModelListFromProvider(this.getProvider(providerName)!);
    const otherModels = this._modelList.filter((m) => m.provider !== providerName);
    this._modelList = [...otherModels, ...staticModels, ...dynamicModels];
    this._modelList.sort((a, b) => a.name.localeCompare(b.name));
  }

  getStaticModelList() {
    return [...this._providers.values()].flatMap((p) => p.staticModels || []);
  }

  getStaticModelListFromProvider(provider: BaseProvider) {
    return provider.staticModels || [];
  }

  async getModelListFromProvider(
    providerArg: BaseProvider,
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
  ): Promise<ModelInfo[]> {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Provider ${providerArg.name} not found`);
    }

    const staticModels = provider.staticModels || [];

    if (!provider.getDynamicModels) {
      return staticModels;
    }

    const { apiKeys, providerSettings, serverEnv } = options;

    const cachedModels = provider.getModelsFromCache({
      apiKeys,
      providerSettings,
      serverEnv,
    });

    if (cachedModels) {
      logger.info(`Found ${cachedModels.length} cached models for ${provider.name}`);
      return [...cachedModels, ...staticModels];
    }

    logger.info(`Getting dynamic models for ${provider.name}`);

    const dynamicModels = await provider
      .getDynamicModels(apiKeys, providerSettings?.[provider.name], serverEnv)
      .then((models) => {
        logger.info(`Caching ${models.length} dynamic models for ${provider.name}`);
        provider.storeDynamicModels(options, models);
        return models;
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Error getting dynamic models for ${provider.name}:`, message);
        return [];
      });

    return [...dynamicModels, ...staticModels];
  }
}
