# Copyright (c) 2024, jumes and contributors
# For license information, please see license.txt

import frappe
import requests
from frappe import _

@frappe.whitelist()
def anthropic_models():
    """
    Proxy endpoint to fetch models from Anthropic API
    
    This endpoint works around CORS restrictions by making the request from the server side
    """
    try:
        api_key = get_anthropic_api_key()
        
        if not api_key:
            frappe.throw(_("Anthropic API key not found. Please set up your API key in settings."))
        
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        response = requests.get(
            "https://api.anthropic.com/v1/models",
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            frappe.throw(_("Failed to fetch models from Anthropic API. Status code: {}").format(response.status_code))
        
        # Get the raw Anthropic API response
        anthropic_response = response.json()
        
        # Frappe automatically wraps the return value in a "message" property
        # so we're returning exactly what we got from Anthropic
        return anthropic_response
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Anthropic Models API Proxy Error")
        frappe.throw(_("Error fetching Anthropic models: {}").format(str(e)))

def get_anthropic_api_key():
    """Get Anthropic API key for the current user"""
    user = frappe.session.user
    llm_settings_name = frappe.db.exists("LLM Settings", {"user": user})

    if not llm_settings_name:
        return None

    doc = frappe.get_doc("LLM Settings", llm_settings_name)
    for setting in doc.provider_settings:
        if setting.provider == "Anthropic":
            return setting.get_password("api_key")

    return None
