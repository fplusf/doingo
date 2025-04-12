import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu';
import { ToastAction } from '@/shared/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { toast } from '@/shared/hooks/use-toast';
import { useNavigate } from '@tanstack/react-router';
import { addMilliseconds, format } from 'date-fns';
import { ArrowRight, GripVertical, LucideFocus, Trash2 } from 'lucide-react';
import React, { useRef } from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import {
  deleteTask,
  setFocused,
  toggleTaskCompletion,
  undoLastFocusAction,
} from '../../store/tasks.store';
import { ONE_HOUR_IN_MS, TaskCardProps } from '../../types';
import { TaskTimer } from '../timer/task-timer';

interface TaskItemProps extends TaskCardProps {
  listeners?: Record<string, any>;
}

export const TaskItem = ({ task, onEdit, effectiveDuration, listeners }: TaskItemProps) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);
  const [titleLineClamp, setTitleLineClamp] = React.useState(1);
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
  const lastFKeyPressTime = useRef<number | null>(null);
  const DOUBLE_PRESS_THRESHOLD = 500;
  const today = new Date();
  const isToday = task.taskDate === format(today, 'yyyy-MM-dd');

  const displayDuration = effectiveDuration ?? task.duration ?? ONE_HOUR_IN_MS;

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

            const taskIsCurrentlyToday = task.taskDate === format(new Date(), 'yyyy-MM-dd');

            if (!taskIsCurrentlyToday) {
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
            navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });

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
  }, [isHovered, navigate, task.id, task.completed, task.taskDate]);

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

  function formatTimeRange(startTimeStr: string, duration: number): string {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMilliseconds(startDate, duration);

    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')} (${formatDurationForDisplay(
      duration,
    )})`;
  }

  function formatCompactTimeRange(startTimeStr: string, duration: number): string {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMilliseconds(startDate, duration);

    return `${format(startDate, 'HH:mm')}-${format(endDate, 'HH:mm')}`;
  }

  const handleFocusClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (task.completed) {
      return;
    }

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
    navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const progress = task.progress ?? 0;

  return (
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
              {hasSubtasks && !task.completed && (
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl">
                  <div
                    className="h-[2px] w-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    aria-label={`${progress}% complete`}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              )}

              <div className="flex h-full flex-grow cursor-pointer items-center justify-between gap-4">
                <TaskCheckbox
                  className={cn(displayDuration <= ONE_HOUR_IN_MS ? 'mx-1 my-0' : 'm-2')}
                  size="lg"
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />

                <div
                  className={cn(
                    'flex w-full',
                    'flex-col py-0',
                    displayDuration <= ONE_HOUR_IN_MS * 2
                      ? 'h-full justify-center pr-12'
                      : 'justify-between py-1',
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
                    {task.isFocused && task.startTime && (
                      <TaskTimer
                        taskId={task.id}
                        startTime={task.startTime}
                        duration={displayDuration}
                        initialTimeSpent={task.timeSpent || 0}
                      />
                    )}
                  </div>

                  {displayDuration <= ONE_HOUR_IN_MS * 2 && task.time && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline">
                        <span className="whitespace-nowrap text-xs opacity-50">
                          {displayDuration <= ONE_HOUR_IN_MS
                            ? formatCompactTimeRange(
                                task.time.split('—')[0],
                                displayDuration || ONE_HOUR_IN_MS,
                              )
                            : formatTimeRange(
                                task.time.split('—')[0],
                                displayDuration || ONE_HOUR_IN_MS,
                              )}
                        </span>
                        {displayDuration <= ONE_HOUR_IN_MS && (
                          <span className="ml-1 whitespace-nowrap text-xs opacity-40">
                            ({formatDurationForDisplay(displayDuration || ONE_HOUR_IN_MS)})
                          </span>
                        )}
                      </div>

                      {hasSubtasks &&
                        task.subtasks &&
                        task.subtasks.length > 0 &&
                        !task.completed && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {Math.round(progress)}%
                          </span>
                        )}
                    </div>
                  )}

                  {displayDuration > ONE_HOUR_IN_MS * 2 && (
                    <section className="mt-auto flex items-center justify-between">
                      <div className="text-xs opacity-50">
                        {task.time ? (
                          <span className="whitespace-nowrap">
                            {formatTimeRange(
                              task.time.split('—')[0],
                              displayDuration || ONE_HOUR_IN_MS,
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center">
                        {hasSubtasks && task.subtasks && (
                          <div className="mr-4 text-xs text-muted-foreground">
                            <span>{Math.round(progress)}%</span>
                            <span className="ml-1">
                              ({task.subtasks.filter((st) => st.isCompleted).length}/
                              {task.subtasks.length})
                            </span>
                          </div>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                  handleFocusClick(e)
                                }
                                className={cn(
                                  'flex h-7 w-7 bg-transparent p-0 hover:bg-transparent',
                                  task.completed && 'hidden',
                                )}
                              >
                                <LucideFocus
                                  className={cn(
                                    'h-4 w-4 transition-all duration-200',
                                    task.isFocused
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

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                  handleDetailsClick(e)
                                }
                                className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
                              >
                                <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Details (D)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </section>
                  )}

                  {displayDuration <= ONE_HOUR_IN_MS * 2 && (
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      {!task.completed && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                  handleFocusClick(e)
                                }
                                className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
                              >
                                <LucideFocus
                                  className={cn(
                                    'h-4 w-4 transition-all duration-200',
                                    task.isFocused
                                      ? 'fill-blue-500 text-blue-500'
                                      : 'text-muted-foreground',
                                    'hover:scale-150 hover:fill-blue-500 hover:text-blue-500',
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Focus (F)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                handleDetailsClick(e)
                              }
                              className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
                            >
                              <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Details (D)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={(e: React.MouseEvent<HTMLDivElement>) => handleDetailsClick(e)}>
            Details
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement>) => handleFocusClick(e)}
            disabled={task.completed}
          >
            Focus
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-500 focus:text-red-600"
            onClick={() => deleteTask(task.id)}
          >
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
  );
};
