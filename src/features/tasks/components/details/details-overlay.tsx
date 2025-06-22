import { tasksStore, updateTask } from '@/features/tasks/stores/tasks.store';
import { OptimalTask } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { TaskDetailsTab } from '@/routes/searchParams';
import { Overlay } from '@/shared/components/ui/overlay';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { ChevronLeft } from 'lucide-react';
import { TaskDetails } from './details';

interface TaskDetailsOverlayProps {
  taskId: string;
}

export function TaskDetailsOverlay({ taskId }: TaskDetailsOverlayProps) {
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const task = tasks.find((t) => t.id === taskId);
  const navigate = useNavigate({ from: '/tasks' });
  const search = useSearch({ from: '/tasks' });
  const currentTab = search.tab || 'document';

  if (!task) return null;

  const handleTaskUpdate = (updatedTask: OptimalTask) => {
    updateTask(updatedTask.id, updatedTask);
  };

  const handleTabChange = (tab: TaskDetailsTab) => {
    navigate({
      search: (prev) => ({ ...prev, tab }),
      replace: true,
    });
  };

  const handleBack = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        taskId: undefined,
        tab: undefined,
      }),
    });
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleBack();
  };

  return (
    <Overlay showCloseButton={false}>
      {/* Header with Back Button and Tab Switcher */}
      <div
        className="flex items-center justify-between p-2 text-sm"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Back Button */}
        <button
          className="absolute left-20 top-2.5 z-50 flex items-center gap-1 rounded-md px-2 py-1 pl-5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleBackClick}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          aria-label="Back to tasks"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Tab Switcher */}
        <div className="flex w-full justify-center">
          <button
            className={cn('rounded-md px-3 py-1', currentTab === 'document' && 'bg-muted')}
            onClick={() => handleTabChange('document')}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            Notes
          </button>
          <button
            className={cn('rounded-md px-3 py-1', currentTab === 'both' && 'bg-muted')}
            onClick={() => handleTabChange('both')}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            Both
          </button>
          <button
            className={cn('rounded-md px-3 py-1', currentTab === 'canvas' && 'bg-muted')}
            onClick={() => handleTabChange('canvas')}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            Canvas
          </button>
        </div>

        {/* Empty div for spacing balance */}
        <div className="w-16"></div>
      </div>

      <div className="relative flex-1">
        <TaskDetails task={task} onEdit={handleTaskUpdate} />
      </div>
    </Overlay>
  );
}
