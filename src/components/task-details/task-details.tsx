import { useNavigate, useSearch } from '@tanstack/react-router';
import React from 'react';
import { Task } from '@/store/tasks.store';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TaskCanvas } from './task-canvas';
import { TaskDocument } from './task-document';
import { cn } from '../../lib/utils';

interface TaskDetailsProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskDetails({ task, onEdit }: TaskDetailsProps) {
  const navigate = useNavigate();
  const search = useSearch({ from: '/tasks/$taskId' });
  const currentTab = search.tab || 'document';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({ to: '..' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <Tabs value={currentTab} className="h-full w-full">
      <TabsContent
        value={currentTab}
        className={cn(
          'm-0 flex h-[calc(100vh-4rem)]',
          currentTab === 'canvas' && 'bg-sidebar',
          currentTab === 'both' && 'bg-sidebar',
        )}
      >
        <div
          className={cn(
            'overflow-y-auto rounded-l-xl bg-background transition-all duration-300 ease-in-out',
            currentTab === 'document' && 'mx-auto max-w-4xl',
            currentTab === 'both' && 'w-1/2',
            currentTab === 'canvas' && 'w-0 opacity-0',
          )}
        >
          <TaskDocument task={task} onEdit={onEdit} className="p-8" />
        </div>
        <div
          tabIndex={0}
          className={cn(
            'overflow-hidden bg-sidebar transition-all duration-300 ease-in-out',
            'transform',
            currentTab === 'document' && 'w-0 translate-x-full opacity-0',
            currentTab === 'both' && 'w-1/2 translate-x-0 rounded-r-xl',
            currentTab === 'canvas' && 'w-full translate-x-0 rounded-xl',
          )}
        >
          <TaskCanvas />
        </div>
      </TabsContent>
    </Tabs>
  );
}
