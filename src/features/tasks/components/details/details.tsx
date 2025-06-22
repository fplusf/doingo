import { cn } from '@/lib/utils';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/shared/components/ui/resizable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import React from 'react';
import { OptimalTask } from '../../types';
import { TaskCanvas } from './canvas';
import { TaskDocument } from './document';

interface TaskDetailsProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
}

export function TaskDetails({ task, onEdit }: TaskDetailsProps) {
  // Use navigate relative to /tasks route to manipulate search params
  const navigate = useNavigate({ from: '/tasks' });
  const search = useSearch({ from: '/tasks' });

  const currentTab = search.tab || 'document';
  const [isCanvasVisible, setIsCanvasVisible] = React.useState(currentTab !== 'document');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({
          search: (prev) => ({
            ...prev,
            taskId: undefined,
            tab: 'document',
          }),
        });
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
      {currentTab === 'both' ? (
        <ResizablePanelGroup direction="horizontal" className="w-full rounded-lg">
          <ResizablePanel minSize={30} defaultSize={38} className="bg-background">
            <TaskDocument task={task} onEdit={onEdit} className="px-8" />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={45} defaultSize={62} className="bg-background">
            <TaskCanvas task={task} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div
            className={cn(
              'overflow-y-auto rounded-l-xl bg-background',
              currentTab === 'document' && 'w-[1000px]',
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
                currentTab === 'canvas' && 'w-full rounded-xl',
              )}
            >
              <TaskCanvas task={task} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
