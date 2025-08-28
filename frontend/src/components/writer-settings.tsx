import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateContent } from '@/lib/history';
import { Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WriterSettingsProps {
    onGenerate: (content?: any) => Promise<void>;
    onGenerateStart?: () => void;
    onError?: (error: string) => void;
    provider: string;
    model: string;
}

export function WriterSettings({ onGenerate, onGenerateStart, onError, provider, model }: WriterSettingsProps) {
  const [contentType, setContentType] = useState('blog-post');
  const [keyword, setKeyword] = useState('');
  const [tone, setTone] = useState('casual');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    // Only validate keyword as it's the only field that truly needs user input
    if (!keyword) {
      alert('Please enter a target keyword or phrase');
      return;
    }
    setIsLoading(true);
    if (onGenerateStart) {
      onGenerateStart();
    }
    const response = await generateContent({
      content_type: contentType,
      keyword,
      tone,
      provider,
      model,
    });

    if (response.error) {
      console.error('Failed to generate content:', response.error);
      if (onError) {
        onError(response.error || 'Failed to generate content');
      }
    } else if (response.message) {
      // Pass the generated content to the parent component
      await onGenerate(response.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="keyword">Target Keyword or Phrase</Label>
            <Textarea id="keyword" placeholder="Enter a keyword or phrase" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select onValueChange={setContentType} value={contentType}>
              <SelectTrigger id="content-type">
                <SelectValue placeholder="Blog Post" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog-post">Blog Post</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="product-description">Product Description</SelectItem>
                <SelectItem value="landing-page">Landing Page</SelectItem>
                <SelectItem value="seo-meta-description">SEO Meta Description</SelectItem>
                <SelectItem value="social-media-post">Social Media Post</SelectItem>
                <SelectItem value="blog-outline">Blog Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tone of Voice</Label>
            <Select onValueChange={setTone} value={tone}>
              <SelectTrigger id="tone">
                <SelectValue placeholder="Professional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="witty">Witty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Button size="lg" className="w-full" onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Content</>}
      </Button>
    </div>
  );
}
