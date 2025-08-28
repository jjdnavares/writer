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

Content Guidelines:
- Provide actionable advice and practical examples
- Include relevant statistics or data points when available
- Address potential reader questions and pain points
- Write in a conversational but authoritative style
- End with a clear call-to-action

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

Content Guidelines:
- Present balanced perspectives on the topic
- Support claims with evidence and reliable sources
- Address counterarguments or alternative viewpoints
- Use industry-specific terminology appropriately
- Maintain objectivity while showcasing expertise

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

Content Guidelines:
- Highlight unique selling points and competitive advantages
- Use sensory language that helps customers visualize using the product
- Include social proof elements (mentions of reviews, awards, etc.)
- Create urgency or exclusivity where appropriate
- Maintain honesty while showcasing the product's best qualities

Format the content in Markdown with appropriate use of bold text, bullet points, and short paragraphs.''',
    'wordCount': 500
  },
  'Landing Page': {
    'template': '''Create converting landing page copy about {keyword} with a {tone} tone.

Optimize for SEO and conversions by:
- Including the main keyword in headings and subheadings
- Using action-oriented language that drives user engagement
- Incorporating high-intent keywords throughout sections
- Creating clear, benefit-focused content blocks
- Using persuasive language that addresses user pain points

Structure:
- Craft an attention-grabbing headline with main keyword
- Create a compelling subheading that clarifies the value proposition
- Develop 3-5 concise benefit sections with H2 headings
- Include social proof elements (testimonials, statistics, etc.)
- Address common objections or FAQs
- End with a strong, clear call-to-action
- Aim for 800-1,200 words of focused, conversion-oriented content

Content Guidelines:
- Lead with benefits, support with features
- Use customer-focused language ("you" instead of "we")
- Keep paragraphs short (1-2 sentences) for easy scanning
- Include bullet points for key features/benefits
- Use power words that trigger emotional responses

Format the content in Markdown with a clear hierarchy of headings, subheadings, and content blocks.''',
    'wordCount': 1000
  },
  'SEO Meta Description': {
    'template': '''Write 5 compelling meta descriptions for content about {keyword} with a {tone} tone.

Optimize for SEO and click-through rates by:
- Including the exact keyword naturally in each description
- Creating unique value propositions for each variation
- Using action words that encourage clicks
- Staying within the 150-160 character limit for each description
- Incorporating a call-to-action where appropriate

Structure:
- Label each meta description (Version 1, Version 2, etc.)
- Include character count at the end of each description
- Present the keyword clearly in each variation
- Create different angles and appeals for each version

Content Guidelines:
- Be specific about what users will find on the page
- Highlight unique benefits or insights offered
- Create a sense of urgency or curiosity when appropriate
- Make each description unique and compelling in its own way
- Ensure each description is factually accurate about the content

Format as plain text with numbered variations.''',
    'wordCount': 150
  },
  'Social Media Post': {
    'template': '''Create a set of 5 engaging social media posts about {keyword} with a {tone} tone.

Optimize for engagement by:
- Crafting attention-grabbing opening lines
- Including relevant hashtags (3-5 per post)
- Creating share-worthy, valuable content
- Incorporating a clear call-to-action in each post
- Varying length and style for different platforms

Structure:
- Label each post with the intended platform (Twitter/X, LinkedIn, Facebook, Instagram, etc.)
- Include character count at the end of each post
- Create a mix of question posts, list posts, and statement posts
- Include suggestion for type of image or video to accompany each post

Content Guidelines:
- Keep Twitter/X posts under 280 characters
- Make LinkedIn posts more professional and detailed (up to 1,300 characters)
- Create conversational Facebook posts (up to 500 characters)
- Design Instagram posts with visual descriptions and many hashtags
- Include emojis where appropriate for the platform and audience

Format as plain text with platform labels and suggested visual elements.''',
    'wordCount': 800
  },
  'Blog Outline': {
    'template': '''Create a comprehensive blog outline for {keyword} with a {tone} tone.

Optimize for SEO by:
- Including the main keyword in the title and key headings
- Organizing content to address search intent comprehensively
- Covering related topics and questions users might have
- Creating a logical flow from basic to advanced concepts
- Including sections for all important aspects of the topic

Structure:
- H1 Title (including main keyword)
- Introduction section (key points to cover)
- 5-7 main H2 headings covering primary subtopics
- 2-3 H3 subheadings under each main heading
- Key points to cover under each subheading
- Conclusion section focus
- Call-to-action suggestion

Content Guidelines:
- Balance informational and engaging sections
- Include at least one list or step-by-step section
- Suggest places to incorporate statistics or examples
- Note opportunities for internal/external linking
- Recommend related keywords to include

Format the outline in Markdown with clear heading hierarchy.''',
    'wordCount': 600
  }
}

HUMANIZE_PROMPT = '''Refine this content to make it feel more human-written and SEO-effective by:

1. Natural Language & Flow:
   - Replace formulaic phrases with natural, conversational alternatives
   - Create rhythm by varying sentence length and structure
   - Smooth transitions between paragraphs and sections
   - Add occasional conversational elements (rhetorical questions, personal observations)

2. SEO Enhancement:
   - Ensure primary keywords appear in first paragraph and conclusion
   - Distribute related keywords naturally throughout content
   - Improve subheading relevance while maintaining keyword presence
   - Enhance readability with appropriate paragraph length (2-3 sentences)

3. Engagement & Authority:
   - Add an authentic voice with thoughtful insights
   - Include relatable examples or scenarios where appropriate
   - Replace generic descriptions with specific, vivid details
   - Use active voice and direct address to create connection

4. Avoid Robotic Patterns:
   - Eliminate repetitive sentence structures
   - Remove overused transition phrases ("furthermore," "moreover," etc.)
   - Replace algorithmic-sounding qualifiers ("very," "extremely," etc.)
   - Transform any formula-following segments into authentic writing

Critical Requirements:
- Preserve all factual information and SEO elements
- Maintain heading structure and keyword optimization
- Ensure the total word count remains approximately the same
- Preserve all HTML/Markdown formatting

The end result should be content that reads as if written by a skilled human writer while maintaining or improving its SEO effectiveness.'''