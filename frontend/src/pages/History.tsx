import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getGeneratedContents } from '@/lib/frappe';
import type { Content } from '@/App';

export function HistoryPage() {
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    const fetchContents = async () => {
      const response = await getGeneratedContents();
      setContents(response.message || []);
    };
    fetchContents();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[80vh]">
            <div className="space-y-2">
              {contents.map((content) => (
                <Link to={`/`} state={{ activeContent: content }} key={content.name}>
                  <div
                    key={content.name}
                    className={`p-2 rounded-md cursor-pointer hover:bg-muted`}
                  >
                    <h4 className="font-semibold">{content.title}</h4>
                    <p className="text-sm text-muted-foreground">{new Date(content.creation).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
