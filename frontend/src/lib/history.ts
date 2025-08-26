export const generateContent = async (params: {
    keyword: string;
    content_type: string;
    tone: string;
    provider: string;
    model: string;
}) => {
    try {
        const response = await fetch("/api/method/writer.api.generate_content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Failed to generate content:', error);
        return { error };
    }
};

export const getGeneratedContents = async () => {
    try {
        const response = await fetch("/api/method/writer.api.get_generated_contents");
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Failed to get generated contents:', error);
        return { error };
    }
};

export const deleteContent = async (name: string) => {
    try {
        const response = await fetch("/api/method/writer.api.delete_content", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        });
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Failed to delete content:', error);
        return { error };
    }
};

export const getContentPrompts = async () => {
    try {
        const response = await fetch("/api/method/writer.api.get_content_prompts");
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Failed to get content prompts:', error);
        return { error };
    }
};
