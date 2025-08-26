CONTENT_PROMPTS = {
    'Blog Post': {
        'template': '''Write a comprehensive blog post about {keyword} with a {tone} tone.

Optimize for SEO by:
- Including the keyword naturally in headings and throughout the content
- Using related keywords and semantic variations
- Creating sections that address key user questions
- Using readable paragraphs with 2-3 sentences each
- Including a compelling introduction and conclusion

Structure:
- Use a catchy H1 title that includes the main keyword
- Break content into logical H2 and H3 sections
- Include bullet points or numbered lists where appropriate
- Add bolded text for important concepts
- Aim for 1,200-1,500 words of valuable, informative content

Format the content in Markdown and make sure all headings follow proper hierarchy.''',
        'wordCount': 1500
    },
    'Article': {
        'template': '''Write an in-depth, journalistic article about {keyword} with a {tone} tone.

Optimize for SEO by:
- Including the keyword strategically in the title, introduction, and conclusion
- Using related keywords and semantic variations throughout
- Creating comprehensive sections that thoroughly explore the topic
- Including expert perspectives or quotable statements
- Writing with clarity and authority

Structure:
- Use a compelling headline that includes the main keyword
- Create a strong introduction that hooks the reader and presents the main thesis
- Organize content into logical sections with descriptive H2 and H3 headings
- Include relevant examples, case studies, or data points
- End with a thought-provoking conclusion
- Aim for 1,500-2,000 words of substantial, informative content

Format the content in Markdown and ensure all headings follow proper hierarchy.''',
        'wordCount': 2000
    },
    'Product Description': {
        'template': '''Write a compelling product description for {keyword} with a {tone} tone.

Optimize for SEO and conversions by:
- Incorporating the product name and key features naturally
- Using benefit-driven language that connects features to user needs
- Including relevant keywords for product category and search intent
- Creating scannable content with clear value propositions
- Writing persuasive copy that drives purchase decisions

Structure:
- Start with an attention-grabbing headline
- Open with a compelling hook that addresses the customer's main pain point
- Break down key features with corresponding benefits
- Include technical specifications where relevant
- Address potential objections or questions
- End with a clear call-to-action
- Aim for 300-500 words of focused, persuasive content

Format the content in Markdown with appropriate use of bold text, bullet points, and short paragraphs.''',
        'wordCount': 500
    },
}

HUMANIZE_PROMPT = '''Refine this content to make it feel more human-written and SEO-effective by:

1. Natural Language & Flow:
   - Replace formulaic phrases with natural, conversational alternatives
   - Create rhythm by varying sentence length and structure
   - Smooth transitions between paragraphs and sections

2. SEO Enhancement:
   - Ensure primary keywords appear in first paragraph and conclusion
   - Distribute related keywords naturally throughout content

3. Engagement & Authority:
   - Add an authentic voice with thoughtful insights
   - Include relatable examples or scenarios where appropriate

4. Avoid Robotic Patterns:
   - Eliminate repetitive sentence structures
   - Remove overused transition phrases ("furthermore," "moreover," etc.)

Critical Requirements:
- Preserve all factual information and SEO elements
- Maintain heading structure and keyword optimization
- Preserve all HTML/Markdown formatting

The end result should be content that reads as if written by a skilled human writer while maintaining or improving its SEO effectiveness.'''
