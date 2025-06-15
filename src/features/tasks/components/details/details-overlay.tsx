import { tasksStore, updateTask } from '@/features/tasks/stores/tasks.store';
import { OptimalTask } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { TaskDetailsTab } from '@/routes/searchParams';
import { Overlay } from '@/shared/components/ui/overlay';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
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
    navigate({ search: (prev) => ({ ...prev, tab }) });
  };

  return (
    <Overlay>
      {/* Tab Switcher */}
      <div className="flex justify-center p-1">
        <button
          className={cn('rounded-md px-3 py-1', currentTab === 'document' && 'bg-muted')}
          onClick={() => handleTabChange('document')}
        >
          Notes
        </button>
        <button
          className={cn('rounded-md px-3 py-1', currentTab === 'both' && 'bg-muted')}
          onClick={() => handleTabChange('both')}
        >
          Both
        </button>
        <button
          className={cn('rounded-md px-3 py-1', currentTab === 'canvas' && 'bg-muted')}
          onClick={() => handleTabChange('canvas')}
        >
          Canvas
        </button>
      </div>
      <div className="relative flex-1">
        {/* Close button */}
        <button
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close details"
          onClick={() => navigate({ search: (prev) => ({ ...prev, taskId: undefined }) })}
        >
          ✕
        </button>
        <TaskDetails task={task} onEdit={handleTaskUpdate} />
      </div>
    </Overlay>
  );
}
