/**
 * Logger Test Script
 * 
 * This script tests the LLMManager's provider switching and logger scoping behavior.
 * It verifies that each provider instance gets its own scoped logger when created.
 */
import { LLMManager } from './frameworks/llm/manager';

/**
 * Simple test function that creates providers and checks their loggers
 * by calling methods that use the logger internally
 */
async function testLoggerScoping() {
  console.log('Starting logger scoping test...');
  
  // Get the LLM manager singleton instance
  const manager = LLMManager.getInstance();
  console.log('LLM Manager instance acquired');
  
  // Initialize the manager to register all providers
  console.log('Initializing LLM Manager...');
  await manager.initialize();
  console.log('LLM Manager initialization complete');
  
  // Test switching between providers and check logger scoping in the console
  // The getDynamicModels method uses logger.debug internally
  console.log('\nTesting OpenAI provider...');
  const openaiProvider = manager.getProvider('OpenAI');
  if (openaiProvider) {
    console.log('OpenAI provider name:', openaiProvider.name);
    // This will use the logger internally
    try {
      await openaiProvider.getDynamicModels();
    } catch (error) {
      console.log('Error with OpenAI provider:', error);
    }
  } else {
    console.log('OpenAI provider not found');
  }
  
  console.log('\nTesting Anthropic provider...');
  const anthropicProvider = manager.getProvider('Anthropic');
  if (anthropicProvider) {
    console.log('Anthropic provider name:', anthropicProvider.name);
    // This will use the logger internally
    try {
      await anthropicProvider.getDynamicModels();
    } catch (error) {
      console.log('Error with Anthropic provider:', error);
    }
  } else {
    console.log('Anthropic provider not found');
  }
  
  console.log('\nTesting Google provider...');
  const googleProvider = manager.getProvider('Google');
  if (googleProvider) {
    console.log('Google provider name:', googleProvider.name);
    // This will use the logger internally
    try {
      await googleProvider.getDynamicModels();
    } catch (error) {
      console.log('Error with Google provider:', error);
    }
  } else {
    console.log('Google provider not found');
  }
  
  console.log('\nTesting OpenAI provider again...');
  const openaiProvider2 = manager.getProvider('OpenAI');
  if (openaiProvider2) {
    console.log('OpenAI provider name (2nd instance):', openaiProvider2.name);
    // This will use the logger internally
    try {
      await openaiProvider2.getDynamicModels();
    } catch (error) {
      console.log('Error with OpenAI provider (2nd instance):', error);
    }
  } else {
    console.log('OpenAI provider (2nd instance) not found');
  }
  
  // Verify that we got different instances
  if (openaiProvider && openaiProvider2) {
    console.log('\nAre the OpenAI instances different objects?', openaiProvider !== openaiProvider2);
  }

  console.log('\nLogger scoping test complete!');
}

// Run the test
testLoggerScoping().catch(console.error);
