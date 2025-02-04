import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMatch, useNavigate, useSearch } from '@tanstack/react-router';

export function taskDetailHeader() {
  return {
    left: () => {
      const navigate = useNavigate();

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '..' })}
          className="gap mt-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      );
    },
    center: () => {
      const match = useMatch({ from: '/tasks/$taskId' });
      const search = useSearch({ from: '/tasks/$taskId' });
      const navigate = useNavigate({ from: '/tasks/$taskId' });
      const currentTab = search.tab || 'document';

      return (
        <Tabs value={currentTab} className="w-[400px]">
          <TabsList className="mx-auto mt-2.5 grid h-9 w-72 grid-cols-3 text-xs">
            <TabsTrigger value="document" className="h-7">
              <button
                onClick={() =>
                  navigate({
                    to: '/tasks/$taskId',
                    params: { taskId: match.params.taskId },
                    search: { tab: 'document' },
                  })
                }
              >
                Document
              </button>
            </TabsTrigger>
            <TabsTrigger value="both" className="h-7">
              <button
                onClick={() =>
                  navigate({
                    to: '/tasks/$taskId',
                    params: { taskId: match.params.taskId },
                    search: { tab: 'both' },
                  })
                }
              >
                Both
              </button>
            </TabsTrigger>
            <TabsTrigger value="canvas" className="h-7">
              <button
                onClick={() =>
                  navigate({
                    to: '/tasks/$taskId',
                    params: { taskId: match.params.taskId },
                    search: { tab: 'canvas' },
                  })
                }
              >
                Canvas
              </button>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
    },
    right: () => <div />, // Empty right section
  };
}
