import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const getDynamicModelsMock = vi.fn();

const mockProvider = {
  name: 'TestProvider',
  staticModels: [{ name: 'static-model', label: 'Static Model', provider: 'TestProvider', maxTokenAllowed: 8000 }],
  config: { apiTokenKey: 'TEST_API_KEY' },
  getDynamicModels: getDynamicModelsMock,
  getModelsFromCache: vi.fn().mockReturnValue(null),
  storeDynamicModels: vi.fn(),
  _initializeModelList: vi.fn(),
  _setProviders: vi.fn(),
  getModelInstance: vi.fn(),
};

describe('LLMManager', () => {
  let llmManager: any;
  let llmEvents: any;

  beforeEach(async () => {
    vi.resetModules(); // Reset modules to clear mocks
    getDynamicModelsMock.mockResolvedValue([
      { name: 'dynamic-model', label: 'Dynamic Model', provider: 'TestProvider', maxTokenAllowed: 8000 },
    ]);

    // Re-import modules to ensure a clean state
    const managerModule = await import('./manager');
    const eventsModule = await import('./events');
    llmManager = managerModule.LLMManager.getInstance();
    llmEvents = eventsModule.llmEvents;

    // Manually inject the mock provider
    const providerMap = new Map();
    providerMap.set(mockProvider.name, mockProvider);
    llmManager._setProviders(providerMap);
  });

  afterEach(async () => {
    llmManager.destroy();
    vi.clearAllMocks();
    // Use the static method to reset the singleton instance
    const managerModule = await import('./manager');
    managerModule.LLMManager.resetInstance();
  });

  it('should initialize and register providers', () => {
    const providers = llmManager.getAllProviders();
    expect(providers.length).toBe(1);
    expect(providers[0].name).toBe('TestProvider');
  });

  it('should fetch dynamic models on apiKeyUpdated event', async () => {
    const apiKey = 'test-api-key';
    llmEvents.emit('apiKeyUpdated', { providerName: 'TestProvider', apiKey });

    // Wait for async operations to complete
    await new Promise(process.nextTick);

    expect(getDynamicModelsMock).toHaveBeenCalledWith({ TEST_API_KEY: apiKey });
    const modelList = llmManager.getModelList();
    expect(modelList).toContainEqual({
      name: 'dynamic-model',
      label: 'Dynamic Model',
      provider: 'TestProvider',
      maxTokenAllowed: 8000,
    });
  });

  it('should clean up event listeners on destroy', () => {
    const offSpy = vi.spyOn(llmEvents, 'off');
    llmManager.destroy();
    expect(offSpy).toHaveBeenCalledWith('apiKeyUpdated', expect.any(Function));
  });
});
