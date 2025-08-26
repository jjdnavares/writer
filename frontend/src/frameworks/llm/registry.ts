/**
 * LLM Provider Registry
 * 
 * This file imports and exports all available LLM providers,
 * making them discoverable by the LLMManager.
 */
import AnthropicProvider from './providers/anthropic';
import GoogleProvider from './providers/google';
import OpenAIProvider from './providers/openai';
import MistralProvider from './providers/mistral';
import CohereProvider from './providers/cohere';
import GroqProvider from './providers/groq';
import AmazonBedrockProvider from './providers/amazon-bedrock';
import OllamaProvider from './providers/ollama';
import OpenRouterProvider from './providers/open-router';
import PerplexityProvider from './providers/perplexity';
import TogetherProvider from './providers/together';
import { BaseProvider } from './base-provider';

export const providers: Record<string, new () => BaseProvider> = {
  OpenAIProvider,
  GoogleProvider,
  AnthropicProvider,
  MistralProvider,
  CohereProvider,
  GroqProvider,
  AmazonBedrockProvider,
  OllamaProvider,
  OpenRouterProvider,
  PerplexityProvider,
  TogetherProvider,
};
