/**
 * Amazon Bedrock Provider
 * 
 * Implements the Amazon Bedrock language model provider with support for
 * AWS Bedrock-hosted models including Claude, Mistral, and Amazon's own models.
 */
import { BaseProvider } from '../base-provider';
import type { ModelInfo } from '@/types/provider';  
import type { LanguageModel } from 'ai';
import type { IProviderSetting } from '@/types/model';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';


/**
 * Configuration interface for AWS Bedrock credentials
 */
interface AWSBedRockConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Amazon Bedrock Provider implementation
 * Supports models hosted on AWS Bedrock including Claude, Mistral, and Amazon Nova models
 */
export default class AmazonBedrockProvider extends BaseProvider {
  static providerName = 'AmazonBedrock';
  constructor() {
    super();
  }
  name = 'AmazonBedrock';
  getApiKeyLink = 'https://console.aws.amazon.com/iam/home';
  labelForGetApiKey = 'Get AWS IAM Credentials';

  config = {
    apiTokenKey: 'AWS_BEDROCK_CONFIG',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      label: 'Claude 3.5 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-sonnet-20240229-v1:0',
      label: 'Claude 3 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'anthropic.claude-3-haiku-20240307-v1:0',
      label: 'Claude 3 Haiku (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'mistral.mistral-large-2402-v1:0',
      label: 'Mistral Large (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 32000,
    },
  ];

  /**
   * Dynamically fetches available models from AWS Bedrock
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
    this.logger.debug(`Getting dynamic models for Amazon Bedrock - hasApiKeys: ${!!apiKeys}, hasSettings: ${!!settings}, hasServerEnv: ${!!serverEnv}`);
    
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'AWS_BEDROCK_CONFIG',
    });

    if (!apiKey) {
      this.logger.warn('No AWS credentials available for Amazon Bedrock, returning only static models');
      return [];
    }
    
    try {
      this.logger.debug('Parsing and validating AWS Bedrock config');
      const config = this._parseAndValidateConfig(apiKey);
      
      this.logger.debug(`Fetching models from AWS Bedrock API for region ${config.region}`);

      // We need to use the AWS SDK to make this request, which requires server-side execution
      // For now, we'll only provide the static models when running in the browser
      if (typeof window !== 'undefined') {
        this.logger.warn('Running in browser environment, skipping dynamic model fetch from AWS Bedrock');
        return [];
      }

      // In a server environment, you could use the AWS SDK to call ListFoundationModels
      // This would require importing the AWS SDK and making the appropriate calls
      // For security reasons and complexity, we're implementing a stub here
      this.logger.debug('Fetching models from AWS Bedrock is not implemented for browser environments');
      
      // Note: In a real implementation, we would use static model names to filter results
      // const staticModelNames = this.staticModels.map(model => model.name);
      
      // In a proper implementation, you would:
      // 1. Use AWS SDK to call bedrock.listFoundationModels()
      // 2. Transform the response to the ModelInfo format
      // 3. Filter out static models

      // For now, return an empty array as we can't directly call AWS API from browser
      return [];
    } catch (error) {
      this.logger.error(`Error fetching Amazon Bedrock models: ${error}`);
      // Don't throw here, just return empty array so UI doesn't break
      return [];
    }
  }

  /**
   * Parse and validate AWS Bedrock configuration from a JSON string
   * 
   * @param apiKey - JSON string containing AWS credentials
   * @returns Validated AWS Bedrock configuration
   * @throws Error if the configuration is invalid or missing required fields
   */
  private _parseAndValidateConfig(apiKey: string): AWSBedRockConfig {
    let parsedConfig: AWSBedRockConfig;

    try {
      parsedConfig = JSON.parse(apiKey);
      this.logger.debug('Successfully parsed AWS Bedrock configuration');
    } catch (error) {
      this.logger.error('Failed to parse AWS Bedrock configuration', { error });
      throw new Error(
        'Invalid AWS Bedrock configuration format. Please provide a valid JSON string containing region, accessKeyId, and secretAccessKey.'
      );
    }

    const { region, accessKeyId, secretAccessKey, sessionToken } = parsedConfig;

    if (!region || !accessKeyId || !secretAccessKey) {
      const missingFields = [];
      if (!region) missingFields.push('region');
      if (!accessKeyId) missingFields.push('accessKeyId');
      if (!secretAccessKey) missingFields.push('secretAccessKey');
      
      this.logger.error('Missing required AWS credentials', { missingFields });
      throw new Error(
        'Missing required AWS credentials. Configuration must include region, accessKeyId, and secretAccessKey.'
      );
    }

    return {
      region,
      accessKeyId,
      secretAccessKey,
      ...(sessionToken && { sessionToken }),
    };
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
      defaultApiTokenKey: 'AWS_BEDROCK_CONFIG',
    });

    if (!apiKey) {
      this.logger.error(`Missing API key for ${this.name} model instance`);
      throw new Error(`Missing API key for ${this.name} provider`);
    }
    
    this.logger.debug('API key retrieved for model instance');

    try {
      this.logger.debug('Parsing and validating AWS Bedrock config');
      const config = this._parseAndValidateConfig(apiKey);
      
      this.logger.debug(`Creating Amazon Bedrock instance - model: ${model}, region: ${config.region}`);
      const bedrock = createAmazonBedrock(config);

      return bedrock(model);
    } catch (error) {
      this.logger.error(`Error creating Amazon Bedrock instance - model: ${model}, error: ${error}`);
      throw error;
    }
  }
}
