/**
 * Ollama Provider
 * 
 * Implements the Ollama language model provider for locally hosted models
 * running in the Ollama application.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { ollama } from 'ollama-ai-provider';


/**
 * Detailed model information from Ollama API
 */
interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

/**
 * Model information structure from Ollama API
 */
export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

/**
 * API response structure from Ollama
 */
export interface OllamaApiResponse {
  models: OllamaModel[];
}

/**
 * Ollama Provider implementation
 * Connects to locally running Ollama instances
 */
export default class OllamaProvider extends BaseProvider {
  static providerName = 'Ollama';
  constructor() {
    super();
  }
  name = 'Ollama';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
    baseUrl: 'http://localhost:11434',
  };

  // No static models - they are discovered dynamically from the running Ollama instance
  staticModels: ModelInfo[] = [];

  /**
   * Adjust base URL for Docker environments
   * This handles the special case where the app is running in a Docker container
   * and needs to connect to the host machine
   * 
   * @param baseUrl - Original base URL
   * @param isDocker - Whether running in Docker container
   * @returns Adjusted base URL
   */
  private adjustBaseUrlForDocker(baseUrl: string, isDocker: boolean): string {
    if (!isDocker) return baseUrl;
    
    // Replace localhost and 127.0.0.1 with host.docker.internal to access host from container
    let adjustedUrl = baseUrl;
    adjustedUrl = adjustedUrl.replace('localhost', 'host.docker.internal');
    adjustedUrl = adjustedUrl.replace('127.0.0.1', 'host.docker.internal');
    
    this.logger.debug(`Adjusted baseUrl for Docker: ${baseUrl} -> ${adjustedUrl}`);
    return adjustedUrl;
  }

  /**
   * Get default context size from environment variables
   * 
   * @param serverEnv - Server environment variables
   * @returns Default context size
   */
  getDefaultNumCtx(serverEnv?: Record<string, unknown>): number {
    const envRecord = this._convertEnvToRecord(serverEnv);
    return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
  }

  /**
   * Dynamically fetches available models from the Ollama instance
   * 
   * @param apiKeys - API keys for providers
   * @param settings - Provider settings
   * @param serverEnv - Server environment variables
   * @returns Array of available models
   */
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    this.logger.debug('Fetching dynamic models from Ollama');
    
    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      baseUrl = this.config.baseUrl;
      this.logger.debug(`No baseUrl found, using default: ${baseUrl}`);
    }

    // Check if we're running in Docker
    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || serverEnv?.RUNNING_IN_DOCKER === 'true';
    
    if (typeof window === 'undefined') {
      // Running in server environment
      baseUrl = this.adjustBaseUrlForDocker(baseUrl, isDocker);
    }

    try {
      this.logger.debug(`Fetching models from ${baseUrl}/api/tags`);
      const response = await fetch(`${baseUrl}/api/tags`);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to fetch models - status: ${response.status}, error: ${errorText}`);
        return [];
      }
      
      const data = (await response.json()) as OllamaApiResponse;
      
      if (!data.models || !Array.isArray(data.models)) {
        this.logger.error('Invalid response format from Ollama API', { response: data });
        return [];
      }
      
      this.logger.debug(`Retrieved ${data.models.length} models from Ollama`);

      return data.models.map((model: OllamaModel) => ({
        name: model.name,
        label: `${model.name} (${model.details.parameter_size})`,
        provider: this.name,
        maxTokenAllowed: 8000,
      }));
    } catch (error) {
      this.logger.error('Error fetching models from Ollama', { error });
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

    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    if (!baseUrl) {
      baseUrl = this.config.baseUrl;
      this.logger.debug(`No baseUrl found, using default: ${baseUrl}`);
    }

    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true' || envRecord.RUNNING_IN_DOCKER === 'true';
    
    if (typeof window === 'undefined') {
      // Running in server environment
      baseUrl = this.adjustBaseUrlForDocker(baseUrl, isDocker);
    }

    this.logger.debug(`Creating Ollama instance - model: ${model}, baseUrl: ${baseUrl}`);
    
    try {
      const numCtx = this.getDefaultNumCtx(serverEnv);
      this.logger.debug(`Using context size: ${numCtx}`);
      
      const ollamaInstance = ollama(model, {
        numCtx,
      }) as unknown as LanguageModel & { config: { baseURL: string } };

      // Set the API base URL
      ollamaInstance.config.baseURL = `${baseUrl}/api`;
      this.logger.debug(`Configured Ollama with baseURL: ${ollamaInstance.config.baseURL}`);

      return ollamaInstance;
    } catch (error) {
      this.logger.error(`Error creating Ollama instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
