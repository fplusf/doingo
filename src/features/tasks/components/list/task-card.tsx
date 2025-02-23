import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getEmojiBackground } from '@/lib/emoji-utils';
import { cn } from '@/lib/utils';
import { deleteTask, setFocused } from '@/store/tasks.store';
import { Link, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ArrowRight, LucideFocus, Smile, Trash2 } from 'lucide-react';
import React from 'react';
import { TaskCardProps } from '../types';

export const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHovered && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (task.completed) {
          // If the task is completed, don't focus it
          return;
        }
        setFocused(task.id, true);
        navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, navigate, task.id, task.completed]);

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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'relative flex h-full w-full flex-col rounded-lg p-0.5 text-current hover:bg-sidebar hover:shadow-md sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]',
            task.completed && 'opacity-45',
            task.isFocused && 'bg-gradient-to-r from-red-500 to-purple-500',
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              task.isFocused && 'bg-sidebar/95',
              'h-full w-full rounded-md p-2 py-4 pr-6',
            )}
          >
            <div
              className="flex h-full flex-grow cursor-pointer items-start justify-between gap-4"
              onClick={() => onEdit(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEdit(task);
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0',
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
              <div className="flex h-full w-full flex-col gap-2">
                <h3
                  className={cn(
                    'mb-auto font-medium',
                    task.completed && 'line-through',
                    task.duration > 2 * 60 * 60 * 1000
                      ? 'line-clamp-2 sm:line-clamp-3'
                      : 'line-clamp-1 sm:line-clamp-2',
                  )}
                >
                  {task.title}
                </h3>

                <section className="flex items-center">
                  <div className="mr-3 text-xs opacity-50 xl:text-sm">
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

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocused(task.id, true);
                            navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
                          }}
                          className={cn(
                            'mx-4 mr-10 flex bg-transparent hover:bg-transparent',
                            task.completed && 'hidden',
                          )}
                        >
                          <LucideFocus
                            className={cn(
                              'ml-2 h-4 w-4 transition-all duration-200',
                              task.isFocused
                                ? 'fill-blue-500 text-blue-500'
                                : 'text-muted-foreground',
                              'hover:scale-150 hover:fill-blue-500 hover:text-blue-500 hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]',
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Focus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {isHovered && (
                    <Link
                      to={'/tasks/$taskId'}
                      params={{ taskId: task.id }}
                      className={cn(
                        'flex items-center justify-start rounded-md p-3 text-xs text-muted-foreground hover:bg-gray-700/40 hover:text-foreground',
                      )}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
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
        <ContextMenuItem className="flex items-center gap-2">
          <LucideFocus className="mr-2 h-4 w-4" />
          Focus
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
