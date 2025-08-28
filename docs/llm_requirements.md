# LLM Provider Requirements

This document outlines the Python packages required for each LLM provider integration supported by the Content Writer application.

## Installation

All required packages are specified in the project's `pyproject.toml` file and can be installed using:

```bash
bench pip install -e /path/to/writer
```

## Required Packages by Provider

| Provider | Required Package | Installation (if needed manually) |
|----------|------------------|----------------------------------|
| OpenAI   | openai           | `bench pip install openai`       |
| Google   | google-generativeai | `bench pip install google-generativeai` |
| Anthropic | anthropic       | `bench pip install anthropic`    |
| Amazon Bedrock | boto3      | `bench pip install boto3`        |
| Groq     | openai           | Uses the OpenAI package          |
| Mistral   | openai          | Uses the OpenAI package          |
| Together AI | openai        | Uses the OpenAI package          |
| OpenRouter | openai         | Uses the OpenAI package          |
| Cohere   | none (uses requests) | Built-in                     |
| Ollama   | none (uses requests) | Built-in                     |
| Perplexity | none (uses requests) | Built-in                   |

## Troubleshooting

If you encounter an error related to missing packages such as:

```
frappe.exceptions.ValidationError: The Google Generative AI package is not installed. Please run 'pip install google-generativeai' to install it.
```

Use the following command to install the missing package:

```bash
bench pip install google-generativeai
```

For multiple providers, you can install all requirements at once:

```bash
bench pip install openai anthropic google-generativeai boto3
```

## Provider-Specific Notes

- **OpenAI**: Used for OpenAI models as well as Groq, Mistral, Together AI, and OpenRouter which use OpenAI-compatible APIs
- **Google**: Requires the `google-generativeai` package for Gemini models
- **Anthropic**: Requires the `anthropic` package for Claude models
- **Amazon Bedrock**: Requires `boto3` and AWS credentials (access key and secret key)
