# Copyright (c) 2024, jumes and contributors
# For license information, please see license.txt

import frappe
from .prompts import CONTENT_PROMPTS, HUMANIZE_PROMPT
import sys
import json
import requests
import importlib.util
from urllib.parse import urljoin

# Try to import provider-specific libraries
def check_dependency(module_name):
    """Check if a Python module is installed and can be imported"""
    return importlib.util.find_spec(module_name) is not None

# Check for provider dependencies
HAS_OPENAI = check_dependency("openai")
HAS_ANTHROPIC = check_dependency("anthropic")
HAS_GOOGLE_GENAI = check_dependency("google.generativeai")
HAS_BOTO3 = check_dependency("boto3")

# Import libraries if available
if HAS_OPENAI:
    import openai
if HAS_ANTHROPIC:
    import anthropic
if HAS_GOOGLE_GENAI:
    import google.generativeai
if HAS_BOTO3:
    import boto3

@frappe.whitelist()
def _call_llm(prompt: str, provider: str, model: str) -> str:
    """
    Main dispatch function for calling different LLM providers.
    
    This function dynamically routes LLM requests to the appropriate provider-specific handler
    based on the provider name, handling API key retrieval and normalization of provider names.
    
    Args:
        prompt (str): The input prompt to send to the LLM
        provider (str): The LLM provider name (OpenAI, Anthropic, Google, etc.)
        model (str): The specific model to use within the provider
        
    Returns:
        str: The generated text response from the LLM
        
    Raises:
        frappe.ValidationError: If the API key is not set or provider is not supported
    """
    provider = provider.lower()
    
    # Get the API key for the selected provider
    api_key_dict = get_llm_api_key(provider)
    api_key = api_key_dict.get("api_key")
    
    if not api_key:
        frappe.throw(f"API key for '{provider}' is not set for the current user.")
    
    # Use dynamic function dispatch pattern to call the appropriate provider handler
    # Normalize provider name to match function naming (lowercase with underscores)
    normalized_provider = provider.lower().replace('-', '_').replace(' ', '_')
    handler_name = f"_call_{normalized_provider}_llm"
    
    current_module = sys.modules[__name__]
    
    if hasattr(current_module, handler_name):
        handler_func = getattr(current_module, handler_name)
        return handler_func(prompt, model, api_key)
    else:
        frappe.log_error(f"No handler found for provider '{provider}' (normalized: '{normalized_provider}')", "LLM Provider Error")
        frappe.throw(f"Provider '{provider}' is not supported yet. Please implement _call_{normalized_provider}_llm function.")


def _call_openai_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call OpenAI's API to generate content.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The OpenAI model to use (e.g. 'gpt-4', 'gpt-3.5-turbo')
        api_key (str): The OpenAI API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If OpenAI package is not installed or API call fails
    """
    if not HAS_OPENAI:
        frappe.log_error("OpenAI package not installed", "Dependency Error")
        frappe.throw("The OpenAI package is not installed. Please run 'pip install openai' to install it.")
        
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "OpenAI API Call Failed")
        frappe.throw(f"An error occurred while calling the OpenAI API: {str(e)}")

def _call_anthropic_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Anthropic's API to generate content.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Anthropic model to use (e.g. 'claude-3-opus', 'claude-3-sonnet')
        api_key (str): The Anthropic API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If Anthropic package is not installed or API call fails
    """
    if not HAS_ANTHROPIC:
        frappe.log_error("Anthropic package not installed", "Dependency Error")
        frappe.throw("The Anthropic package is not installed. Please run 'pip install anthropic' to install it.")
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model=model,
            max_tokens=4000,
            system="You are a helpful assistant that generates high-quality content.",
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Anthropic API Call Failed")
        frappe.throw(f"An error occurred while calling the Anthropic API: {str(e)}")

def _call_google_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Google's Generative AI API to generate content.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Google Generative AI model to use (e.g. 'gemini-pro', 'gemini-ultra')
        api_key (str): The Google API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If Google Generative AI package is not installed or API call fails
    """
    if not HAS_GOOGLE_GENAI:
        frappe.log_error("Google Generative AI package not installed", "Dependency Error")
        frappe.throw("The Google Generative AI package is not installed. Please run 'pip install google-generativeai' to install it.")
    
    try:
        genai = google.generativeai
        genai.configure(api_key=api_key)
        
        model_obj = genai.GenerativeModel(model)
        response = model_obj.generate_content(
            contents=[
                {"role": "user", "parts": [prompt]}
            ],
        )
        return response.text
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Google API Call Failed")
        frappe.throw(f"An error occurred while calling the Google API: {str(e)}")

def _call_cohere_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Cohere's API to generate content using direct HTTP requests.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Cohere model to use
        api_key (str): The Cohere API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If API call fails
    """
    try:
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
            "https://api.cohere.ai/v1/generate",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        return result.get("text", "")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Cohere API Call Failed")
        frappe.throw(f"An error occurred while calling the Cohere API: {str(e)}")

def _call_groq_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Groq's API to generate content using OpenAI's compatible interface.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Groq model to use (e.g. 'llama3-70b-8192')
        api_key (str): The Groq API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If OpenAI package is not installed or API call fails
    """
    if not HAS_OPENAI:
        frappe.log_error("OpenAI package not installed", "Dependency Error")
        frappe.throw("The OpenAI package is not installed. Please run 'pip install openai' to install it.")
    
    try:
        # Create OpenAI client with Groq base URL
        client = openai.OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Groq API Call Failed")
        frappe.throw(f"An error occurred while calling the Groq API: {str(e)}")

def _call_mistral_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Mistral's API to generate content using OpenAI's compatible interface.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Mistral model to use (e.g. 'mistral-small', 'mistral-medium')
        api_key (str): The Mistral API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If OpenAI package is not installed or API call fails
    """
    if not HAS_OPENAI:
        frappe.log_error("OpenAI package not installed", "Dependency Error")
        frappe.throw("The OpenAI package is not installed. Please run 'pip install openai' to install it.")
    
    try:
        # Create OpenAI client with Mistral base URL
        client = openai.OpenAI(api_key=api_key, base_url="https://api.mistral.ai/v1")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Mistral API Call Failed")
        frappe.throw(f"An error occurred while calling the Mistral API: {str(e)}")

def _call_ollama_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Ollama's API to generate content. 
    
    Note that for Ollama, the api_key parameter is actually used to provide the base URL
    to a self-hosted Ollama instance.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Ollama model to use
        api_key (str): The base URL of the Ollama server (not an actual API key)
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If API call fails
    """
    try:
        # Extract base URL from api_key (Ollama uses base URL as key)
        base_url = api_key.strip()
        if not base_url.endswith("/"):
            base_url = base_url + "/"
            
        endpoint = urljoin(base_url, "api/chat")
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt}
            ]
        }
        
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()
        result = response.json()
        
        return result.get("message", {}).get("content", "")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Ollama API Call Failed")
        frappe.throw(f"An error occurred while calling the Ollama API: {str(e)}")

def _call_perplexity_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Perplexity's API to generate content using direct HTTP requests.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Perplexity model to use
        api_key (str): The Perplexity API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If API call fails
    """
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt}
            ]
        }
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Perplexity API Call Failed")
        frappe.throw(f"An error occurred while calling the Perplexity API: {str(e)}")

def _call_together_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Together AI's API to generate content using OpenAI's compatible interface.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Together model to use (e.g. 'llama-2-70b', 'mistral-7b')
        api_key (str): The Together API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If OpenAI package is not installed or API call fails
    """
    if not HAS_OPENAI:
        frappe.log_error("OpenAI package not installed", "Dependency Error")
        frappe.throw("The OpenAI package is not installed. Please run 'pip install openai' to install it.")
    
    try:
        # Create OpenAI client with Together base URL
        client = openai.OpenAI(api_key=api_key, base_url="https://api.together.xyz/v1")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Together API Call Failed")
        frappe.throw(f"An error occurred while calling the Together API: {str(e)}")

def _call_amazon_bedrock_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call Amazon Bedrock's API to generate content.
    
    Amazon Bedrock requires AWS credentials and boto3 library. The API key should be a JSON
    with access_key, secret_key, and optionally region fields.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The Amazon Bedrock model to use (e.g. 'anthropic.claude-v2', 'amazon.titan-text')
        api_key (str): JSON string containing AWS credentials (access_key and secret_key)
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If boto3 package is not installed, credentials are invalid, or API call fails
    """
    if not HAS_BOTO3:
        frappe.log_error("boto3 package not installed", "Dependency Error")
        frappe.throw("Amazon Bedrock support requires boto3 library. Please run 'pip install boto3' to install it.")
        
    try:
        # For Amazon Bedrock we need both access key and secret key
        keys = json.loads(api_key) if isinstance(api_key, str) and api_key.startswith('{') else {"access_key": api_key}
        access_key = keys.get("access_key")
        secret_key = keys.get("secret_key")
        region = keys.get("region", "us-east-1")
        
        if not access_key or not secret_key:
            frappe.throw("Amazon Bedrock requires both access key and secret key")
        
        # Initialize boto3 client for Bedrock
        bedrock_runtime = boto3.client(
            service_name="bedrock-runtime",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
        
        # Prepare the request body based on the model provider
        provider_prefix = model.split('.')[0] if '.' in model else ''
        
        if provider_prefix.lower() == 'anthropic':
            request_body = {
                "prompt": f"\n\nHuman: {prompt}\n\nAssistant:",
                "max_tokens_to_sample": 2000,
                "temperature": 0.7
            }
        elif provider_prefix.lower() == 'amazon':
            request_body = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 2000,
                    "temperature": 0.7
                }
            }
        else:  # Default to a generic format for other providers
            request_body = {
                "prompt": prompt,
                "max_tokens": 2000,
                "temperature": 0.7
            }
        
        response = bedrock_runtime.invoke_model(
            modelId=model,
            body=json.dumps(request_body)
        )
        
        # Parse the response based on the model provider
        response_body = json.loads(response['body'].read())
        
        if provider_prefix.lower() == 'anthropic':
            return response_body.get('completion', '')
        elif provider_prefix.lower() == 'amazon':
            return response_body.get('results', [{}])[0].get('outputText', '')
        else:
            return response_body.get('generated_text', '')
            
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Amazon Bedrock API Call Failed")
        frappe.throw(f"An error occurred while calling Amazon Bedrock: {str(e)}")

def _call_open_router_llm(prompt: str, model: str, api_key: str) -> str:
    """
    Call OpenRouter's API to generate content using OpenAI's compatible interface.
    
    OpenRouter is a unified API that provides access to various LLM providers through
    a single interface and API key.
    
    Args:
        prompt (str): The input prompt to send to the model
        model (str): The OpenRouter model ID to use
        api_key (str): The OpenRouter API key
        
    Returns:
        str: The generated text response
        
    Raises:
        frappe.ValidationError: If OpenAI package is not installed or API call fails
    """
    if not HAS_OPENAI:
        frappe.log_error("OpenAI package not installed", "Dependency Error")
        frappe.throw("The OpenAI package is not installed. Please run 'pip install openai' to install it.")
    
    try:
        # Create OpenAI client with OpenRouter base URL
        client = openai.OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates high-quality content."},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "OpenRouter API Call Failed")
        frappe.throw(f"An error occurred while calling the OpenRouter API: {str(e)}")

@frappe.whitelist()
def generate_content(keyword: str, content_type: str, tone: str, provider: str, model: str):
    # 1. Get the appropriate prompt template
    prompt_info = CONTENT_PROMPTS.get(content_type)
    if not prompt_info:
        frappe.throw(f"Invalid content type: {content_type}")

    # 2. Create the initial prompt
    initial_prompt = prompt_info['template'].format(keyword=keyword, tone=tone)

    # 3. (Mock) Generate the raw content
    raw_content = _call_llm(initial_prompt, provider, model)

    # 4. Create the humanizing prompt
    humanize_prompt = f"{HUMANIZE_PROMPT}\n\nContent to humanize:\n{raw_content}"

    # 5. (Mock) Generate the final, humanized content
    final_content = _call_llm(humanize_prompt, provider, model)

    # 6. Save the generated content to the database
    doc = frappe.new_doc("Generated Content")
    doc.title = f"{content_type} for {keyword}"
    doc.generated_text = final_content
    doc.prompt = initial_prompt
    doc.keyword = keyword
    doc.tone = tone
    doc.content_type = content_type
    doc.provider = provider
    doc.model = model
    doc.user = frappe.session.user
    doc.insert()

    return doc.as_dict()

@frappe.whitelist()
def get_generated_contents():
    if not frappe.db.exists("DocType", "Generated Content"):
        return []
        
    return frappe.get_all(
        "Generated Content",
        fields=["name", "title", "generated_text", "keyword", "tone", "content_type", "creation"],
        order_by="creation desc"
    )

@frappe.whitelist()
def delete_content(name: str):
    frappe.delete_doc("Generated Content", name)
    return {"status": "success"}

@frappe.whitelist()
def get_content_prompts():
    return CONTENT_PROMPTS

@frappe.whitelist()
def set_llm_api_key(provider: str, api_key: str):
    user = frappe.session.user
    llm_settings_name = frappe.db.exists("LLM Settings", {"user": user})

    if llm_settings_name:
        doc = frappe.get_doc("LLM Settings", llm_settings_name)
    else:
        doc = frappe.new_doc("LLM Settings")
        doc.user = user

    # Check if the provider already exists
    provider_exists = False
    for setting in doc.provider_settings:
        if setting.provider == provider:
            setting.api_key = api_key
            provider_exists = True
            break

    if not provider_exists:
        doc.append("provider_settings", {
            "provider": provider,
            "api_key": api_key
        })

    doc.save(ignore_permissions=True)
    return {"status": "success"}


@frappe.whitelist()
def get_llm_api_key(provider: str):
    user = frappe.session.user
    llm_settings_name = frappe.db.exists("LLM Settings", {"user": user})

    if not llm_settings_name:
        return {}

    doc = frappe.get_doc("LLM Settings", llm_settings_name)
    for setting in doc.provider_settings:
        if setting.provider == provider:
            return {"api_key": setting.get_password("api_key")}

    return {}
