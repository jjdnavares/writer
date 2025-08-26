# Copyright (c) 2024, jumes and contributors
# For license information, please see license.txt

import frappe
from .prompts import CONTENT_PROMPTS, HUMANIZE_PROMPT
import openai

@frappe.whitelist()
def _get_openai_client(provider: str):
    api_key_dict = get_llm_api_key(provider)
    api_key = api_key_dict.get("api_key")

    if not api_key:
        frappe.throw(f"API key for '{provider}' is not set for the current user.")
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
