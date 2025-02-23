import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useMatch, useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';

export function TaskDetailHeader() {
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
            <TabsTrigger
              value="document"
              className="h-7"
              onClick={() =>
                navigate({
                  to: '/tasks/$taskId',
                  params: { taskId: match.params.taskId },
                  search: { tab: 'document' },
                })
              }
            >
              Document
            </TabsTrigger>
            <TabsTrigger
              value="both"
              className="h-7"
              onClick={() =>
                navigate({
                  to: '/tasks/$taskId',
                  params: { taskId: match.params.taskId },
                  search: { tab: 'both' },
                })
              }
            >
              Both
            </TabsTrigger>
            <TabsTrigger
              value="canvas"
              className="h-7"
              onClick={() =>
                navigate({
                  to: '/tasks/$taskId',
                  params: { taskId: match.params.taskId },
                  search: { tab: 'canvas' },
                })
              }
            >
              Canvas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
    },
    right: () => <div />, // Empty right section
  };
}
