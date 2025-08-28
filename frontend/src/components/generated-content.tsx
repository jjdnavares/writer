import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Copy, Rocket, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Content } from "../App";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Progress } from "@/components/ui/progress";
import "./markdown.css"; // We'll create this file separately

interface GeneratedContentProps {
    activeContent: Content | null;
    onDelete: (name: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

export function GeneratedContent({ activeContent, onDelete, isLoading = false, error = null }: GeneratedContentProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          // Slowly increase up to 95%, the last 5% will be filled when content is actually ready
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 2;
        });
      }, 300);
    } else if (!error) {
      setProgress(100);
    } else {
      // If there's an error, reset progress
      setProgress(0);
    }  
    // Reset to 0 after animation completes
    const timeout = setTimeout(() => setProgress(0), 1000);
    return () => clearTimeout(timeout);
  }, [isLoading, error]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{activeContent ? activeContent.title : 'Generated Content'}</CardTitle>
        {activeContent && (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(activeContent.generated_text || activeContent.content || '')}>
                    <Copy className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(activeContent.name)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
      </CardHeader>
      <CardContent>
        {(isLoading || (progress > 0 && !error)) && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className={`h-10 w-10 text-primary ${isLoading ? 'animate-spin' : 'opacity-0 transition-opacity duration-500'}`} />
            </div>
            <Progress 
              value={progress} 
              className={`w-full transition-all duration-300 ${!isLoading && progress === 100 ? 'bg-green-100' : ''}`} 
            />
            <p className="text-center text-sm text-muted-foreground">
              {isLoading ? 'Generating content, please wait...' : progress === 100 ? 'Content generated!' : ''}
            </p>
          </div>
        )}
        
        {error && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-medium text-red-800 dark:text-red-300">Generation Failed</h3>
                <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
                <p className="text-sm text-red-500 dark:text-red-400 mt-3">Please try again or adjust your settings.</p>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className={`h-[60vh] ${isLoading ? 'opacity-30' : ''}`}>
          {activeContent ? (
            <div className="p-4 markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeContent.generated_text || activeContent.content || ''}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted bg-muted/20 p-12 text-center h-full">
                <div className="rounded-full bg-muted p-3">
                    <Rocket className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Ready to Boost Your Rankings?</h3>
                    <p className="text-sm text-muted-foreground">
                    Start generating SEO-optimized content that drives more traffic and grows your business.
                    </p>
                    <p className="text-sm text-muted-foreground pt-4">Generated content will appear here</p>
                </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
