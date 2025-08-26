import type { ModelInfo } from '@/types/provider';

/**
 * A simple event bus for handling API key changes and other events.
 */

interface LlmEvents {
  apiKeyUpdated: { providerName: string; apiKey: string };
  modelListUpdated: ModelInfo[];
}

type ApiKeyUpdatedHandler = (payload: LlmEvents['apiKeyUpdated']) => void;
type ModelListUpdatedHandler = (payload: LlmEvents['modelListUpdated']) => void;

class EventBus {
  private apiKeyUpdatedHandlers: ApiKeyUpdatedHandler[] = [];
  private modelListUpdatedHandlers: ModelListUpdatedHandler[] = [];

  on(event: 'apiKeyUpdated', handler: ApiKeyUpdatedHandler): void;
  on(event: 'modelListUpdated', handler: ModelListUpdatedHandler): void;
  on(event: keyof LlmEvents, handler: ApiKeyUpdatedHandler | ModelListUpdatedHandler): void {
    if (event === 'apiKeyUpdated') {
      this.apiKeyUpdatedHandlers.push(handler as ApiKeyUpdatedHandler);
    } else if (event === 'modelListUpdated') {
      this.modelListUpdatedHandlers.push(handler as ModelListUpdatedHandler);
    }
  }

  off(event: 'apiKeyUpdated', handler: ApiKeyUpdatedHandler): void;
  off(event: 'modelListUpdated', handler: ModelListUpdatedHandler): void;
  off(event: keyof LlmEvents, handler: ApiKeyUpdatedHandler | ModelListUpdatedHandler): void {
    if (event === 'apiKeyUpdated') {
      this.apiKeyUpdatedHandlers = this.apiKeyUpdatedHandlers.filter((h) => h !== handler);
    } else if (event === 'modelListUpdated') {
      this.modelListUpdatedHandlers = this.modelListUpdatedHandlers.filter((h) => h !== handler);
    }
  }

  emit(event: 'apiKeyUpdated', payload: LlmEvents['apiKeyUpdated']): void;
  emit(event: 'modelListUpdated', payload: LlmEvents['modelListUpdated']): void;
  emit(event: keyof LlmEvents, payload: LlmEvents['apiKeyUpdated'] | LlmEvents['modelListUpdated']): void {
    if (event === 'apiKeyUpdated') {
      this.apiKeyUpdatedHandlers.forEach((handler) => handler(payload as LlmEvents['apiKeyUpdated']));
    } else if (event === 'modelListUpdated') {
      this.modelListUpdatedHandlers.forEach((handler) => handler(payload as LlmEvents['modelListUpdated']));
    }
  }
}

export const llmEvents = new EventBus();
