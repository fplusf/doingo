import { deleteTask, setFocused } from '@/features/tasks/store/tasks.store';
import { getEmojiBackground } from '@/lib/emoji-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { toast } from '@/shared/hooks/use-toast';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ArrowRight, LucideFocus, Smile, Trash2 } from 'lucide-react';
import React from 'react';
import { TaskCardProps } from '../../types';

export const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);
  const today = new Date();
  const isToday = task.taskDate === format(today, 'yyyy-MM-dd');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHovered) {
        // Handle 'F' key for focus
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();

          if (task.completed) {
            // Don't focus completed tasks
            return;
          }

          if (!isToday) {
            // Show toast for non-today tasks
            toast({
              title: 'Focus not available',
              description:
                "Focusing possible only on today's tasks. If you want to focus on a task, move it to today.",
              duration: 5000,
            });
            return;
          }

          // Set focus but don't navigate to details
          setFocused(task.id, true);
        }

        // Handle 'D' key for details - works for any task regardless of date
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, navigate, task.id, task.completed, isToday]);

  function formatDurationForDisplay(duration: number): string {
    const minutes = duration / 60_000;
    if (minutes < 0) {
      // If duration is negative, it means the task crosses midnight
      // Add 24 hours (1440 minutes) to get the correct duration
      const adjustedMinutes = minutes + 1440;
      if (adjustedMinutes >= 60) {
        const hours = adjustedMinutes / 60;
        return `${Math.floor(hours)} hr${hours > 1 ? 's' : ''}`;
      }
      return `${Math.floor(adjustedMinutes)} min`;
    }
    if (minutes >= 60) {
      const hours = minutes / 60;
      return `${Math.floor(hours)} hr${hours > 1 ? 's' : ''}`;
    }
    return `${Math.floor(minutes)} min`;
  }

  const handleFocusClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (task.completed) {
      return; // Don't focus completed tasks
    }

    if (!isToday) {
      // Show toast for non-today tasks
      toast({
        title: 'Focus not available',
        description:
          "Focusing possible only on today's tasks. If you want to focus on a task, move it to today.",
        duration: 5000,
      });
      return;
    }

    // Just set focus, don't navigate to details
    setFocused(task.id, true);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };

  // Calculate if we should show the progress bar
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const progress = task.progress ?? 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'task-card border-secondary-600/50 relative flex h-full w-full flex-col rounded-2xl bg-card p-0.5 text-current hover:bg-card hover:shadow-md sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]',
            task.completed && 'bg-transparent opacity-45',
            task.isFocused && isToday && 'bg-gradient-to-r from-red-500 to-purple-500',
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              task.isFocused && isToday && 'bg-sidebar/95',
              'relative h-full w-full rounded-md p-2 py-4 pr-6',
            )}
          >
            {/* Progress bar - only visible for tasks with subtasks */}
            {hasSubtasks && !task.completed && (
              <div className="absolute left-0 top-0 h-[3px] w-full overflow-hidden rounded-t-md">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  aria-label={`${progress}% complete`}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}

            <div
              className="flex h-full flex-grow cursor-pointer items-center justify-between gap-4"
              onClick={() => onEdit(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEdit(task);
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full p-0',
                  task.emoji ? getEmojiBackground(task.emoji, task.category) : 'hover:bg-accent/25',
                )}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {task.emoji ? (
                  <span className="text-lg sm:text-xl">{task.emoji}</span>
                ) : (
                  <Smile className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex h-full w-full flex-col justify-between py-1">
                <h3 className={cn('line-clamp-2 font-medium', task.completed && 'line-through')}>
                  {task.title}
                </h3>

                <section className="mt-auto flex items-center justify-between">
                  <div className="text-xs opacity-50 xl:text-sm">
                    <span className="mr-2">
                      {task.startTime && !isNaN(task.startTime.getTime())
                        ? format(task.startTime, 'MMM dd yyyy')
                        : ''}
                    </span>
                    {task.startTime &&
                    task.nextStartTime &&
                    !isNaN(task.startTime.getTime()) &&
                    !isNaN(task.nextStartTime.getTime()) ? (
                      <>
                        {format(task.startTime, 'HH:mm')} - {format(task.nextStartTime, 'HH:mm')} (
                        {formatDurationForDisplay(task.duration)})
                      </>
                    ) : null}
                  </div>

                  <div className="flex items-center">
                    {/* Subtask progress indicator - only visible for tasks with subtasks */}
                    {hasSubtasks && task.subtasks && (
                      <div className="mr-4 text-xs text-muted-foreground">
                        <span>{Math.round(progress)}%</span>
                        <span className="ml-1">
                          ({task.subtasks.filter((st) => st.isCompleted).length}/
                          {task.subtasks.length})
                        </span>
                      </div>
                    )}

                    {/* Focus button - always visible but only works for today's tasks */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFocusClick}
                            className={cn(
                              'mx-4 mr-6 flex bg-transparent hover:bg-transparent',
                              task.completed && 'hidden',
                            )}
                          >
                            <LucideFocus
                              className={cn(
                                'ml-2 h-4 w-4 transition-all duration-200',
                                task.isFocused && isToday
                                  ? 'fill-blue-500 text-blue-500'
                                  : 'text-muted-foreground',
                                'hover:scale-150 hover:fill-blue-500 hover:text-blue-500 hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]',
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Focus (F)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Details button - always works */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDetailsClick}
                            className="mr-4 flex bg-transparent hover:bg-transparent"
                          >
                            <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Details (D)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => deleteTask(task.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Task
        </ContextMenuItem>

        <ContextMenuItem className="flex items-center gap-2" onClick={handleFocusClick}>
          <LucideFocus className="mr-2 h-4 w-4" />
          Focus
        </ContextMenuItem>

        <ContextMenuItem className="flex items-center gap-2" onClick={handleDetailsClick}>
          <ArrowRight className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
