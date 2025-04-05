import { deleteTask, setFocused, toggleTaskCompletion } from '@/features/tasks/store/tasks.store';
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
import { addMilliseconds, format } from 'date-fns';
import { ArrowRight, LucideFocus, Trash2 } from 'lucide-react';
import React from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { ONE_HOUR_IN_MS, TaskCardProps } from '../../types';
import { SortableTaskItem } from './sortable-task-item';

export const TaskItem = ({ task, onEdit }: TaskCardProps) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);
  const [titleLineClamp, setTitleLineClamp] = React.useState(1);
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
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

  // Get dynamic height and line clamp classes based on task duration
  const getCardHeightClasses = () => {
    // 0 to 1 hour: 60px height, 1 line of text
    if (task.duration <= ONE_HOUR_IN_MS) {
      return {
        cardHeight: 'h-[60px]',
        lineClamp: 'line-clamp-1',
      };
    }
    // 1 to 2 hours: 120px height, 2 lines of text (intermediate size)
    else if (task.duration <= ONE_HOUR_IN_MS * 2) {
      return {
        cardHeight: 'h-[120px]',
        lineClamp: 'line-clamp-2',
      };
    }
    // 2 to 4 hours: 170px height, 3 lines of text
    else if (task.duration <= ONE_HOUR_IN_MS * 4) {
      return {
        cardHeight: 'h-[170px]',
        lineClamp: 'line-clamp-3',
      };
    }
    // 4+ hours: 280px height, 6 lines of text
    else {
      return {
        cardHeight: 'h-[280px]',
        lineClamp: 'line-clamp-6',
      };
    }
  };

  const { cardHeight, lineClamp } = getCardHeightClasses();

  // Add resize observer to adjust title line clamp based on container height
  React.useEffect(() => {
    if (!titleContainerRef.current) return;

    const updateTitleLineClamp = () => {
      const container = titleContainerRef.current;
      if (!container) return;

      const containerHeight = container.offsetHeight;
      const lineHeight = 20; // Approximate line height for text-sm (16px) + some spacing
      const paddingTop = task.duration <= ONE_HOUR_IN_MS ? 0 : 4; // py-1 = 4px
      const marginBottom = task.duration <= ONE_HOUR_IN_MS ? 2 : 4; // mb-0.5 or mb-1
      const timeInfoHeight = task.duration <= ONE_HOUR_IN_MS * 2 ? 20 : 24; // Height of time info
      const controlsHeight = task.duration > ONE_HOUR_IN_MS * 2 ? 32 : 0; // Height of controls section

      // Calculate available height for title
      const availableHeight =
        containerHeight - paddingTop * 2 - marginBottom - timeInfoHeight - controlsHeight;

      // Calculate maximum possible lines that could fit
      const maxPossibleLines = Math.floor(availableHeight / lineHeight);

      // Set line clamp based on task duration
      let newLineClamp;
      if (task.duration <= ONE_HOUR_IN_MS) {
        newLineClamp = 1; // Small tasks: always 1 line
      } else if (task.duration <= ONE_HOUR_IN_MS * 2) {
        newLineClamp = Math.min(2, maxPossibleLines); // Medium tasks: up to 2 lines
      } else if (task.duration <= ONE_HOUR_IN_MS * 4) {
        newLineClamp = Math.min(3, maxPossibleLines); // Large tasks (2-4 hours): up to 3 lines
      } else {
        // Extra large tasks (>4 hours): force 6 lines if space allows
        newLineClamp = Math.min(6, Math.max(4, maxPossibleLines)); // Minimum 4 lines, maximum 6 lines
      }

      setTitleLineClamp(newLineClamp);
    };

    // Run initial calculation after a short delay to ensure container is properly sized
    const initialTimeout = setTimeout(updateTitleLineClamp, 0);

    // Set up resize observer for subsequent updates
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
  }, [task.duration]);

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

    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')} (${formatDurationForDisplay(duration)})`;
  }

  // More compact time format for small tasks
  function formatCompactTimeRange(startTimeStr: string, duration: number): string {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMilliseconds(startDate, duration);

    // Format as "HH:mm-HH:mm"
    return `${format(startDate, 'HH:mm')}-${format(endDate, 'HH:mm')}`;
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
    <div className="h-full">
      <SortableTaskItem task={task}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'task-card relative flex h-full w-full flex-col rounded-3xl bg-card sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]',
                task.isFocused && isToday && 'bg-gradient-to-r from-orange-300 to-orange-600',
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEdit(task);
              }}
              style={{
                border: '1px solid transparent',
                transition: 'border-color 0.2s ease-in-out, height 0.2s ease-in-out',
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className={cn(
                  task.isFocused && isToday && 'bg-sidebar/95',
                  'relative h-full w-full rounded-3xl',
                  // Adjust padding for short tasks
                  task.duration <= ONE_HOUR_IN_MS ? 'p-0 px-4 py-0' : 'p-2 py-4',
                )}
              >
                {/* Progress bar - only visible for tasks with subtasks */}
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
                    className={cn(task.duration <= ONE_HOUR_IN_MS ? 'mx-1 my-0' : 'm-2')}
                    size="lg"
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                  />

                  <div
                    className={cn(
                      'flex w-full',
                      // Maintain vertical layout for all tasks but adjust spacing
                      'flex-col py-0',
                      // Adjust vertical alignment based on task size
                      task.duration <= ONE_HOUR_IN_MS * 2
                        ? 'h-full justify-center pr-12' // Use center alignment for both 1 and 2 hour tasks
                        : 'justify-between py-1',
                    )}
                    ref={titleContainerRef}
                  >
                    {/* For all tasks, show title vertically, but adjust size for short tasks */}
                    <h3
                      className={cn(
                        // Use consistent text-sm for all task titles
                        'text-sm font-medium',
                        // Different spacing based on task size
                        task.duration <= ONE_HOUR_IN_MS * 2 ? 'mb-1' : '', // Consistent margin for 1-2 hour tasks
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

                    {/* Show compact time info below title for all tasks */}
                    {task.duration <= ONE_HOUR_IN_MS * 2 && task.time && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline">
                          <span className="whitespace-nowrap text-xs opacity-50">
                            {task.duration <= ONE_HOUR_IN_MS
                              ? formatCompactTimeRange(
                                  task.time.split('—')[0],
                                  task.duration || ONE_HOUR_IN_MS,
                                )
                              : formatTimeRange(
                                  task.time.split('—')[0],
                                  task.duration || ONE_HOUR_IN_MS,
                                )}
                          </span>
                          {task.duration <= ONE_HOUR_IN_MS && (
                            <span className="ml-1 whitespace-nowrap text-xs opacity-40">
                              ({formatDurationForDisplay(task.duration || ONE_HOUR_IN_MS)})
                            </span>
                          )}
                        </div>

                        {/* Progress indicator for small and medium tasks with subtasks */}
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

                    {/* Only show detailed time and controls section for tasks longer than 2 hours */}
                    {task.duration > ONE_HOUR_IN_MS * 2 && (
                      <section className="mt-auto flex items-center justify-between">
                        <div className="text-xs opacity-50">
                          {task.time ? (
                            <span className="whitespace-nowrap">
                              {formatTimeRange(
                                task.time.split('—')[0],
                                task.duration || ONE_HOUR_IN_MS,
                              )}
                            </span>
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
                                    'flex h-7 w-7 bg-transparent p-0 hover:bg-transparent',
                                    task.completed && 'hidden',
                                  )}
                                >
                                  <LucideFocus
                                    className={cn(
                                      'h-4 w-4 transition-all duration-200',
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

                    {/* For small and medium tasks, show compact controls on the right side */}
                    {task.duration <= ONE_HOUR_IN_MS * 2 && (
                      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                        {/* Focus button for small and medium tasks */}
                        {!task.completed && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleFocusClick}
                                  className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
                                >
                                  <LucideFocus
                                    className={cn(
                                      'h-4 w-4 transition-all duration-200',
                                      task.isFocused && isToday
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

                        {/* Details button for small and medium tasks */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDetailsClick}
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
      </SortableTaskItem>
    </div>
  );
};
