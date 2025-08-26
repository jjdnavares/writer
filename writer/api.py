# Copyright (c) 2024, jumes and contributors
# For license information, please see license.txt

import frappe
from .prompts import CONTENT_PROMPTS, HUMANIZE_PROMPT
import openai
import os

def _get_openai_client(provider: str):
    # It's recommended to set the API key in site_config.json
    # e.g. "openai_api_key": "your-api-key"
    api_key = frappe.conf.get(f"{provider}_api_key")

    # Fallback for backward compatibility or global key
    if not api_key and provider == "openai":
        api_key = frappe.conf.get("openai_api_key")

    if not api_key:
        frappe.throw(f"API key for '{provider}' is not set in site_config.json.")
    return openai.OpenAI(api_key=api_key)

def _call_llm(prompt: str, provider: str, model: str) -> str:
    if provider != "openai":
        frappe.throw(f"Provider '{provider}' is not supported yet.")

    try:
        client = _get_openai_client(provider)
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
    doc.content = final_content
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
        fields=["name", "title", "content", "keyword", "tone", "content_type", "creation"],
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
    # Note: This is a simplified approach. For production, use a more secure secret management system.
    # This key is stored globally for this example.
    # A better approach would be to store it per-user and encrypted.
    frappe.conf[f"{provider}_api_key"] = api_key
    frappe.conf.save()
    return {"status": "success"}

@frappe.whitelist()
def get_llm_api_key(provider: str):
    api_key = frappe.conf.get(f"{provider}_api_key")
    return {"api_key": api_key} if api_key else {}
