import { FrappeApp } from "frappe-js-sdk";

const frappe = new FrappeApp("http://localhost:8000");
const call = frappe.call();

export const generateContent = async (params: {
    keyword: string;
    content_type: string;
    tone: string;
    provider: string;
    model: string;
}) => {
    try {
        return await call.post("writer.api.generate_content", params);
    } catch (error) {
        console.error('Failed to generate content:', error);
        return { error };
    }
};

export const getGeneratedContents = async () => {
    return await call.get("writer.api.get_generated_contents");
};

export const deleteContent = async (name: string) => {
    return await call.delete("writer.api.delete_content", { name });
};

export const getContentPrompts = async () => {
    return await call.get("writer.api.get_content_prompts");
};
