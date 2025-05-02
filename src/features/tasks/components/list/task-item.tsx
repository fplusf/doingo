import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ToastAction } from '@/shared/components/ui/toast';
import { toast } from '@/shared/hooks/use-toast';
import { useNavigate } from '@tanstack/react-router';
import { addMilliseconds, format, isSameDay } from 'date-fns';
import { GripVertical, Trash2 } from 'lucide-react';
import React, { useRef } from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { useTaskHistoryContext } from '../../providers/task-history-provider';
import {
  deleteTask,
  setFocused,
  toggleTaskCompletion,
  undoLastFocusAction,
} from '../../stores/tasks.store';
import { ONE_HOUR_IN_MS, TaskCardProps } from '../../types';
import { TaskItemActionButtons } from './task-item-action-buttons';

interface TaskItemProps extends TaskCardProps {
  listeners?: Record<string, any>;
}

export const TaskItem = ({ task, onEdit, effectiveDuration, listeners }: TaskItemProps) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);
  const [titleLineClamp, setTitleLineClamp] = React.useState(1);
  const [showRefocusDialog, setShowRefocusDialog] = React.useState(false);
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
  const lastFKeyPressTime = useRef<number | null>(null);
  const DOUBLE_PRESS_THRESHOLD = 500;
  const today = new Date();
  const isToday = task.taskDate === format(today, 'yyyy-MM-dd');

  const displayDuration = effectiveDuration ?? task.duration ?? 45 * 60 * 1000;

  const { addDeleteTaskAction } = useTaskHistoryContext();

  const applyTaskFocus = React.useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const isTaskFromToday = task.taskDate === today;

    if (!isTaskFromToday) {
      toast({
        title: 'Moving task to today',
        description:
          'The task will be moved to current time and focused. Any uncompleted tasks that overlap with this time period will be rescheduled.',
        duration: 5000,
        action: (
          <ToastAction altText="Undo" onClick={() => undoLastFocusAction()}>
            Undo
          </ToastAction>
        ),
      });
    } else {
      toast({
        title: 'Focusing task',
        description:
          'The task will be moved to current time. Any uncompleted tasks that overlap with this time period will be rescheduled.',
        duration: 5000,
        action: (
          <ToastAction altText="Undo" onClick={() => undoLastFocusAction()}>
            Undo
          </ToastAction>
        ),
      });
    }

    setFocused(task.id, true);
    // Delay navigation slightly to ensure state update completes
    setTimeout(() => {
      navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
    }, 0);
  }, [task.id, task.taskDate, navigate]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHovered) {
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          const now = Date.now();

          if (
            lastFKeyPressTime.current &&
            now - lastFKeyPressTime.current < DOUBLE_PRESS_THRESHOLD
          ) {
            if (task.completed) return;

            if (task.isFocused) {
              setShowRefocusDialog(true);
              lastFKeyPressTime.current = null;
              return;
            }

            applyTaskFocus();
            lastFKeyPressTime.current = null;
          } else {
            lastFKeyPressTime.current = now;
          }
        }

        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
        }
      }
    };

    const handleMouseLeave = () => {
      lastFKeyPressTime.current = null;
    };
    const currentElement = titleContainerRef.current;
    if (currentElement) {
      currentElement.addEventListener('mouseleave', handleMouseLeave);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (currentElement) {
        currentElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isHovered, task.id, task.completed, task.isFocused, applyTaskFocus, navigate]);

  React.useEffect(() => {
    if (!titleContainerRef.current) return;

    const updateTitleLineClamp = () => {
      const container = titleContainerRef.current;
      if (!container) return;

      const currentDuration = displayDuration;

      const containerHeight = container.offsetHeight;
      const lineHeight = 20;
      const paddingTop = currentDuration <= ONE_HOUR_IN_MS ? 0 : 4;
      const marginBottom = currentDuration <= ONE_HOUR_IN_MS ? 2 : 4;
      const timeInfoHeight = currentDuration <= ONE_HOUR_IN_MS * 2 ? 20 : 24;
      const controlsHeight = currentDuration > ONE_HOUR_IN_MS * 2 ? 32 : 0;

      const availableHeight =
        containerHeight - paddingTop * 2 - marginBottom - timeInfoHeight - controlsHeight;
      const maxPossibleLines = Math.floor(availableHeight / lineHeight);

      let newLineClamp;
      if (currentDuration <= ONE_HOUR_IN_MS) {
        newLineClamp = 1;
      } else if (currentDuration <= ONE_HOUR_IN_MS * 2) {
        newLineClamp = Math.min(2, maxPossibleLines);
      } else if (currentDuration <= ONE_HOUR_IN_MS * 4) {
        newLineClamp = Math.min(3, maxPossibleLines);
      } else {
        newLineClamp = Math.min(6, Math.max(4, maxPossibleLines));
      }
      setTitleLineClamp(newLineClamp);
    };

    const initialTimeout = setTimeout(updateTitleLineClamp, 0);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateTitleLineClamp);
    });
    resizeObserver.observe(titleContainerRef.current);

    return () => {
      clearTimeout(initialTimeout);
      if (titleContainerRef.current) {
        resizeObserver.unobserve(titleContainerRef.current);
      }
    };
  }, [displayDuration]);

  function formatDurationForDisplay(duration: number): string {
    const minutes = duration / 60_000;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    if (hours === 0) {
      return `${remainingMinutes} min`;
    }
    return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr, ${remainingMinutes} min`;
  }

  function formatTimeRange(startDate: Date, duration: number): string {
    const endDate = addMilliseconds(startDate, duration);
    const isNextDay = !isSameDay(startDate, endDate);
    const endTimeFormatted = `${format(endDate, 'HH:mm')}${isNextDay ? '<span class="text-[8px] align-super ml-0.5">+1</span>' : ''}`;

    return `${format(startDate, 'HH:mm')} - ${endTimeFormatted} (${formatDurationForDisplay(
      duration,
    )})`;
  }

  function formatCompactTimeRange(startDate: Date, duration: number): string {
    const endDate = addMilliseconds(startDate, duration);
    const isNextDay = !isSameDay(startDate, endDate);
    const endTimeFormatted = `${format(endDate, 'HH:mm')}${isNextDay ? '<span class="text-[8px] align-super ml-0.5">+1</span>' : ''}`;

    return `${format(startDate, 'HH:mm')}-${endTimeFormatted}`;
  }

  const handleFocusClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.stopPropagation();

    if (task.completed) {
      return;
    }

    if (task.isFocused) {
      setShowRefocusDialog(true);
      return;
    }

    applyTaskFocus();
  };

  const handleDetailsClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.stopPropagation();
    navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const progress = task.progress ?? 0;

  const handleDeleteTask = () => {
    // Store the task before deletion
    const taskToDelete = { ...task };

    // Delete the task
    deleteTask(task.id);

    // Add to history for undo/redo
    addDeleteTaskAction(task.id, taskToDelete);
  };

  return (
    <>
      <div className="group relative h-full">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'task-card relative flex h-full w-full flex-col rounded-3xl bg-card sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]',
                task.isFocused && 'shadow-md shadow-blue-500/20 ring-2 ring-blue-500',
                task.completed && 'opacity-60 transition-opacity duration-300 hover:opacity-100',
              )}
              onMouseEnter={(e) => {
                setIsHovered(true);
                e.currentTarget.style.borderColor = '#4d5057';
              }}
              onMouseLeave={(e) => {
                setIsHovered(false);
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onClick={() => onEdit(task)}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter') onEdit(task);
              }}
              style={{
                border: '1px solid transparent',
                transition:
                  'border-color 0.2s ease-in-out, height 0.2s ease-in-out, box-shadow 0.3s ease',
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className={cn(
                  task.isFocused && 'bg-blue-50 dark:bg-blue-950/20',
                  'relative h-full w-full rounded-3xl',
                  displayDuration <= ONE_HOUR_IN_MS ? 'p-0 px-4 py-0' : 'p-2 py-4',
                )}
              >
                <div className="flex h-full flex-grow cursor-pointer items-center justify-between gap-4">
                  <TaskCheckbox
                    className={cn(displayDuration <= ONE_HOUR_IN_MS ? 'mx-1 my-0' : 'm-2')}
                    size="lg"
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    data-task-id={task.id}
                  />

                  <div
                    className={cn(
                      'flex w-full',
                      'flex-col py-0',
                      displayDuration <= ONE_HOUR_IN_MS * 2
                        ? 'h-full justify-center pr-16'
                        : 'justify-between py-1 pr-2',
                    )}
                    ref={titleContainerRef}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          'text-sm font-medium',
                          displayDuration <= ONE_HOUR_IN_MS * 2 ? 'mb-1' : '',
                          task.completed && 'line-through opacity-60',
                        )}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: titleLineClamp,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {task.title}
                      </h3>
                    </div>

                    {/* Short Duration Time Display */}
                    {displayDuration <= ONE_HOUR_IN_MS * 2 && task.startTime && (
                      <div className="mr-2 flex items-center justify-between">
                        <div className="flex items-baseline">
                          <span
                            className="whitespace-nowrap text-xs opacity-50"
                            dangerouslySetInnerHTML={{
                              __html: formatCompactTimeRange(
                                task.startTime,
                                displayDuration || 45 * 60 * 1000,
                              ),
                            }}
                          />
                          <span className="ml-1 whitespace-nowrap text-xs opacity-40">
                            ({formatDurationForDisplay(displayDuration || 45 * 60 * 1000)})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Long Duration Time Display */}
                    {displayDuration > ONE_HOUR_IN_MS * 2 && task.startTime && (
                      <section className="mr-2 mt-auto flex items-center justify-between">
                        <div className="text-xs opacity-50">
                          <span
                            className="whitespace-nowrap"
                            dangerouslySetInnerHTML={{
                              __html: formatTimeRange(
                                task.startTime,
                                displayDuration || 45 * 60 * 1000,
                              ),
                            }}
                          />
                        </div>
                      </section>
                    )}
                    {/* Fallback for long duration with no start time */}
                    {displayDuration > ONE_HOUR_IN_MS * 2 && !task.startTime && (
                      <section className="mr-2 mt-auto flex items-center justify-between">
                        <div className="text-xs opacity-50">
                          <span className="whitespace-nowrap">
                            {formatDurationForDisplay(displayDuration || 45 * 60 * 1000)}
                          </span>
                        </div>
                      </section>
                    )}

                    {/* Progress bar - Still absolutely positioned */}
                    {hasSubtasks &&
                      task.subtasks &&
                      task.subtasks.length > 0 &&
                      !task.completed && (
                        <div className="absolute bottom-2 right-[70px] z-10 flex items-center gap-2">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted/30">
                            <div
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Render the Action Buttons component here, outside the main flex flow */}
                <TaskItemActionButtons
                  isHovered={isHovered}
                  isCompleted={task.completed ?? false}
                  isFocused={task.isFocused ?? false}
                  onFocusClick={handleFocusClick}
                  onDetailsClick={handleDetailsClick}
                />
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={(e: React.MouseEvent<HTMLDivElement>) => handleDetailsClick(e)}
            >
              Details
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e: React.MouseEvent<HTMLDivElement>) => handleFocusClick(e)}
              disabled={task.completed}
            >
              Focus
            </ContextMenuItem>
            <ContextMenuItem className="text-red-500 focus:text-red-600" onClick={handleDeleteTask}>
              Delete
              <Trash2 className="ml-auto h-4 w-4" />
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Drag Handle - Only appears if listeners are provided */}
        {listeners && (
          <div
            {...listeners}
            className="absolute right-8 top-1/2 z-50 flex h-10 w-6 -translate-y-1/2 cursor-grab items-center justify-center opacity-0 transition-opacity duration-150 hover:opacity-100 active:cursor-grabbing group-hover:opacity-80"
            aria-label="Drag task"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Drag to reorder</span>
            <GripVertical className="h-5 w-5 text-muted-foreground/80 transition-colors hover:text-foreground" />
          </div>
        )}
      </div>

      {/* Refocus confirmation dialog */}
      <Dialog open={showRefocusDialog} onOpenChange={setShowRefocusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task already in focus</DialogTitle>
            <DialogDescription>
              This task is already in focus mode. Do you want to refocus it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefocusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRefocusDialog(false);
                applyTaskFocus();
              }}
            >
              Refocus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
