import { cn } from '@/lib/utils';
import { Task } from '@/store/tasks.store';
import { useNavigate, useSearch } from '@tanstack/react-router';
import React from 'react';
import { TaskCanvas } from './canvas';
import { TaskDocument } from './document';

interface TaskDetailsProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskDetails({ task, onEdit }: TaskDetailsProps) {
  const navigate = useNavigate();
  const search = useSearch({ from: '/tasks/$taskId' });

  const currentTab = search.tab || 'document';
  const [isCanvasVisible, setIsCanvasVisible] = React.useState(currentTab !== 'document');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // reset the search params for tab to document
        navigate({
          to: '/tasks/$taskId',
          params: { taskId: task.id },
          search: { tab: 'document' },
        });
        // navigate back
        navigate({ to: '..' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  React.useEffect(() => {
    setIsCanvasVisible(currentTab !== 'document');
  }, [currentTab]);

  return (
    <section
      className={cn(
        'm-0 flex h-full w-full justify-center overflow-auto',
        (currentTab === 'canvas' || currentTab === 'both') && 'bg-sidebar',
      )}
    >
      <div
        className={cn(
          'overflow-y-auto rounded-l-xl bg-background',
          currentTab === 'document' && 'w-[1000px]',
          currentTab === 'both' && 'w-1/2',
          currentTab === 'canvas' && 'w-0 opacity-0',
        )}
      >
        <TaskDocument task={task} onEdit={onEdit} className="px-8" />
      </div>
      {isCanvasVisible && (
        <div
          className={cn(
            'h-full bg-background',
            currentTab === 'document' && 'w-0 translate-x-full opacity-0',
            currentTab === 'both' && 'w-1/2 rounded-r-xl',
            currentTab === 'canvas' && 'w-full rounded-xl',
          )}
        >
          <TaskCanvas task={task} />
        </div>
      )}
    </section>
  );
}
