/**
 * LLM Framework - Type definitions
 */

// Provider types
export interface LLMProvider {
  name: string;
  displayName: string;
  description: string;
  requiresApiKey: boolean;
  models?: LLMModel[];
}

// Model types
export interface LLMModel {
  name: string;
  description: string;
  provider: string;
}
