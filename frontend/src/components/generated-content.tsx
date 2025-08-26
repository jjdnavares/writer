import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Copy, Rocket } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Content } from "../App";

interface GeneratedContentProps {
    activeContent: Content | null;
    onDelete: (name: string) => void;
}

export function GeneratedContent({ activeContent, onDelete }: GeneratedContentProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{activeContent ? activeContent.title : 'Generated Content'}</CardTitle>
        {activeContent && (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(activeContent.content)}>
                    <Copy className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(activeContent.name)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] prose dark:prose-invert max-w-none">
          {activeContent ? (
            <div dangerouslySetInnerHTML={{ __html: activeContent.content.replace(/\n/g, '<br />') }} />
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
