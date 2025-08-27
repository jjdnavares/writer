# Adding New LLM Providers to Writer

This guide explains how to add new Large Language Model (LLM) providers to the Writer application. The architecture is designed to be modular and extensible, making it straightforward to integrate additional providers as they become available.

## Architecture Overview

The Writer application uses a dynamic dispatch system to route LLM requests to provider-specific handler functions:

1. **Frontend**: Provider implementations in TypeScript that handle model fetching, API key management, and model initialization
2. **Backend**: Provider-specific Python functions that perform the actual API calls

## Backend Implementation

### Step 1: Add Provider Function

Create a new function in `writer/api.py` with the naming convention `_call_{provider_name}_llm`. The provider name should be lowercase with hyphens/spaces replaced by underscores.

```python
def _call_your_provider_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call YourProvider's API to generate content.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The YourProvider model to use
        api_key (str): The YourProvider API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If API call fails or required dependencies are missing
    """
    # Add dependency check if needed
    if not HAS_YOUR_DEPENDENCY:
        frappe.log_error("Your dependency package not installed", "Dependency Error")
        frappe.throw("Required package not installed. Please run 'pip install your-dependency' to install it.")
    
    try:
        # Implementation goes here
        # This could use direct HTTP requests or a provider SDK
        
        # Example using an SDK:
        client = your_provider_sdk.Client(api_key=api_key)
        response = client.generate(prompt=prompt, model=model)
        return response.text
        
        # Example using direct HTTP requests:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "prompt": prompt,
            "max_tokens": 2048
        }
        response = requests.post(
            "https://api.your-provider.com/generate",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        return result.get("text", "")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "YourProvider API Call Failed")
        frappe.throw(f"An error occurred while calling the YourProvider API: {str(e)}")
```

### Step 2: Add Dependency Check (Optional)

If your provider requires specific Python packages, add a check at the top of `api.py`:

```python
try:
    import your_provider_sdk
    HAS_YOUR_DEPENDENCY = True
except ImportError:
    HAS_YOUR_DEPENDENCY = False
```

### Step 3: Test the Backend Implementation

Test your implementation with a simple prompt to ensure it works correctly:

```python
# For testing in the Frappe shell
from writer.api import _call_llm
response = _call_llm("Write a short poem about coding", "your-provider", "your-model-name")
print(response)
```

## Frontend Implementation

### Step 1: Create Provider File

Create a new TypeScript file in `frontend/src/frameworks/llm/providers/your-provider.ts`:

```typescript
import { ModelConfig, ModelInstance, Provider } from "../../../types/provider";

// Define models available for this provider
const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "your-model-name",
    name: "Your Model",
    maxTokens: 8192,
    provider: "your-provider",
  }
];

// Provider class implementation
export class YourProviderProvider implements Provider {
  id = "your-provider";
  name = "Your Provider";
  
  // Get available models (static list or dynamically fetched)
  async getModels(apiKey: string): Promise<ModelConfig[]> {
    return AVAILABLE_MODELS;
  }
  
  // Create a model instance 
  async createModel(modelConfig: ModelConfig, apiKey: string): Promise<ModelInstance> {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    
    return {
      id: modelConfig.id,
      name: modelConfig.name,
      maxTokens: modelConfig.maxTokens,
      provider: this.id,
      
      // Generate function that will call the backend API
      generate: async (prompt: string) => {
        try {
          const response = await fetch("/api/method/writer.api._call_llm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              provider: this.id,
              model: modelConfig.id,
            }),
          });
          
          const data = await response.json();
          if (data.exc_type) {
            throw new Error(data.message);
          }
          
          return data.message;
        } catch (error) {
          console.error("Error generating content with Your Provider:", error);
          throw error;
        }
      }
    };
  }
  
  // Check if the provider is configured with a valid API key
  async isConfigured(apiKey: string): Promise<boolean> {
    return !!apiKey;
  }
}

export default new YourProviderProvider();
```

### Step 2: Register the Provider

Update the provider registry in `frontend/src/frameworks/llm/providers/index.ts`:

```typescript
import yourProvider from "./your-provider";

// Add to the existing providers array
const providers = [
  // ... existing providers
  yourProvider,
];

export default providers;
```

### Step 3: Update Provider Types (if needed)

If your provider needs special handling, update the provider types in `frontend/src/types/provider.ts`.

## API Key Management

Ensure users can add API keys for the new provider by adding it to the API key management UI:

1. Ensure the provider is included in dropdown lists for adding new API keys
2. Add appropriate validation for API key format if needed
3. Add instructions for users on how to obtain API keys for this provider

## Testing End to End

1. Add API key for the new provider in the user settings
2. Select the provider in the UI and choose one of its models
3. Send a test prompt to verify the integration is working correctly

## Best Practices

1. **Error Handling**: Always include comprehensive error handling in both frontend and backend
2. **Dependency Management**: Clearly document any required dependencies for the provider
3. **Documentation**: Add clear docstrings and comments to explain provider-specific behavior
4. **Rate Limiting**: Consider implementing rate limiting for providers with usage restrictions
5. **Security**: Never hardcode API keys; always use the application's key management system
6. **Consistency**: Follow the naming conventions used by existing providers

## Example: Adding a Fictional "SmartAI" Provider

### Backend:

```python
# In api.py
try:
    import smartai
    HAS_SMARTAI = True
except ImportError:
    HAS_SMARTAI = False

def _call_smartai_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call SmartAI's API to generate content.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The SmartAI model to use
        api_key (str): The SmartAI API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If API call fails or SmartAI package is not installed
    """
    if not HAS_SMARTAI:
        frappe.log_error("SmartAI package not installed", "Dependency Error")
        frappe.throw("The SmartAI package is not installed. Please run 'pip install smartai' to install it.")
    
    try:
        client = smartai.Client(api_key=api_key)
        response = client.generate(
            model=model,
            prompt=prompt,
            max_tokens=4000
        )
        return response.text
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "SmartAI API Call Failed")
        frappe.throw(f"An error occurred while calling the SmartAI API: {str(e)}")
```

### Frontend:

```typescript
// In frontend/src/frameworks/llm/providers/smartai.ts
import { ModelConfig, ModelInstance, Provider } from "../../../types/provider";

const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "smartai-large",
    name: "SmartAI Large",
    maxTokens: 8192,
    provider: "smartai",
  },
  {
    id: "smartai-medium",
    name: "SmartAI Medium",
    maxTokens: 4096,
    provider: "smartai",
  }
];

export class SmartAIProvider implements Provider {
  id = "smartai";
  name = "SmartAI";
  
  async getModels(apiKey: string): Promise<ModelConfig[]> {
    return AVAILABLE_MODELS;
  }
  
  async createModel(modelConfig: ModelConfig, apiKey: string): Promise<ModelInstance> {
    if (!apiKey) {
      throw new Error("SmartAI API key is required");
    }
    
    return {
      id: modelConfig.id,
      name: modelConfig.name,
      maxTokens: modelConfig.maxTokens,
      provider: this.id,
      
      generate: async (prompt: string) => {
        try {
          const response = await fetch("/api/method/writer.api._call_llm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              provider: this.id,
              model: modelConfig.id,
            }),
          });
          
          const data = await response.json();
          if (data.exc_type) {
            throw new Error(data.message);
          }
          
          return data.message;
        } catch (error) {
          console.error("Error generating content with SmartAI:", error);
          throw error;
        }
      }
    };
  }
  
  async isConfigured(apiKey: string): Promise<boolean> {
    return !!apiKey;
  }
}

export default new SmartAIProvider();
```

This completes the implementation for adding a new provider to the Writer application.
