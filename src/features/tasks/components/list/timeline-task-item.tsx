import {
  clearResizingState,
  setResizingState,
  tasksStore,
  toggleTaskCompletion,
  updateTask,
} from '@/features/tasks/stores/tasks.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Blend, ChevronDown, ChevronsDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTaskHistoryContext } from '../../providers/task-history-provider';
import { updateCompletionStatus } from '../../stores/task-form.store';
import { ONE_HOUR_IN_MS, OptimalTask } from '../../types';
import { BreakWidget } from '../schedule/break-widget';
import { TimelineItem } from '../timeline/timeline';
import { TaskItem } from './task-item';

// Constants
const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const EIGHT_HOURS_MS = 8 * ONE_HOUR_IN_MS; // 8 hours in milliseconds
const MIN_HEIGHT_PX = 58; // Minimum height
const MAX_HEIGHT_PX = MIN_HEIGHT_PX + EIGHT_HOURS_MS / (60 * 1000); // Maximum height = base height + 8 hours in pixels

// GSAP Plugin Registration
gsap.registerPlugin(Draggable);

interface TimelineTaskItemProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
  isLastItem?: boolean;
  nextTask?: OptimalTask;
  overlapsWithNext?: boolean;
  isEarliestFocused?: boolean;
}

// Helper function to get tasks sorted by start time for a given date
const getSortedTasksForDate = (tasks: OptimalTask[], date: string): OptimalTask[] => {
  return tasks
    .filter((t) => t.taskDate === date)
    .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));
};

export const TimelineTaskItem = ({
  task,
  onEdit,
  isLastItem = false,
  nextTask,
  overlapsWithNext = false,
  isEarliestFocused = false,
}: TimelineTaskItemProps) => {
  const timelineNodeRef = useRef<HTMLDivElement>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const bottomHandleRef = useRef<HTMLDivElement>(null);
  const bottomProxyRef = useRef<HTMLDivElement>(null);
  const scrollStartPositionRef = useRef(0);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  const [resizing, setResizing] = useState(false);
  const lastBottomY = useRef(0);
  const resizingState = tasksStore.state.resizingState;
  const isCurrentlyResizing = resizingState.taskId === task.id;

  const effectiveDuration = isCurrentlyResizing
    ? (resizingState.temporaryDuration ?? task.duration)
    : task.duration;
  const effectiveEndTime = isCurrentlyResizing
    ? (resizingState.temporaryEndTime ?? task.nextStartTime)
    : task.nextStartTime;

  const heightToDuration = (heightPx: number): number => {
    const minutes = Math.max(0, heightPx - MIN_HEIGHT_PX);
    let durationMs = minutes * 60 * 1000;
    durationMs = Math.round(durationMs / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
    return Math.max(FIVE_MINUTES_MS, Math.min(EIGHT_HOURS_MS, durationMs));
  };

  const handleRefUpdate = (node: HTMLDivElement | null) => {
    setContainerElement(node);
  };

  // --- Refs to hold current values for GSAP callbacks ---
  const taskRef = useRef(task);
  const containerElementRef = useRef(containerElement);
  const resizingRef = useRef(resizing);

  // Keep refs updated
  useEffect(() => {
    taskRef.current = task;
  }, [task]);
  useEffect(() => {
    containerElementRef.current = containerElement;
  }, [containerElement]);
  useEffect(() => {
    resizingRef.current = resizing;
  }, [resizing]);
  // --------------------------------------------------------

  // --- Effect for Initial Height Setting ---
  useEffect(() => {
    const currentContainer = containerElementRef.current;
    // Check refs for dragging and resizing status
    if (currentContainer && !resizingRef.current) {
      const currentTask = taskRef.current;
      const initialHeight = MIN_HEIGHT_PX + (currentTask.duration || FIVE_MINUTES_MS) / (60 * 1000);
      // Use overwrite: 'auto' to prevent potential conflicts if GSAP tries setting height multiple times
      gsap.set(currentContainer, { height: initialHeight, overwrite: 'auto' });
    }
    // Dependencies: containerElement state, task duration (for initial calc), resizing state
  }, [containerElement, task.duration, resizing]);
  // ------------------------------------------

  // --- Effect for Draggable Setup ---
  useEffect(() => {
    const handleEl = bottomHandleRef.current;
    const proxyEl = bottomProxyRef.current;
    // Access container via state, not ref, as its change triggers this effect
    const contEl = containerElement;

    if (!handleEl || !proxyEl || !contEl) return;

    // Define callbacks using refs where necessary to access latest values
    const updateBottom = function (this: Draggable) {
      const currentContainer = containerElementRef.current; // Use ref
      if (!currentContainer) return;

      const scrollContainer = document.querySelector('.scroll-area-viewport') as HTMLDivElement;
      const scrollTop = scrollContainer?.scrollTop || 0;
      const adjustedY = this.y + (scrollTop - scrollStartPositionRef.current);
      const diffY = adjustedY - lastBottomY.current;
      const currentHeight = gsap.getProperty(currentContainer, 'height') as number;
      const newHeight = Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, currentHeight + diffY));

      gsap.set(currentContainer, { height: newHeight, overwrite: 'auto' });
      const newDuration = heightToDuration(newHeight);
      const currentTask = taskRef.current; // Use ref

      if (currentTask.startTime) {
        const newEndTime = new Date(currentTask.startTime.getTime() + newDuration);
        setResizingState(currentTask.id, newDuration, newEndTime);
      }
      lastBottomY.current = adjustedY;
    };

    const onPressHandler = function (this: Draggable, event: PointerEvent) {
      event.stopPropagation();
      setResizing(true); // Update state
      const scrollContainer = document.querySelector('.scroll-area-viewport') as HTMLDivElement;
      scrollStartPositionRef.current = scrollContainer?.scrollTop || 0;
      lastBottomY.current = this.y;

      const currentTask = taskRef.current; // Use ref
      if (currentTask) {
        setResizingState(currentTask.id, currentTask.duration, currentTask.nextStartTime);
      }
      if (scrollContainer) {
        scrollContainer.style.overflow = 'hidden';
      }
    };

    const onReleaseHandler = function () {
      const currentContainer = containerElementRef.current; // Use ref
      const currentTask = taskRef.current; // Use ref
      if (!currentContainer || !currentTask.startTime) return;

      const scrollContainer = document.querySelector('.scroll-area-viewport') as HTMLDivElement;
      if (scrollContainer) {
        scrollContainer.style.overflow = '';
      }

      // Get the final height directly from the element after GSAP drag ends
      const finalHeight = gsap.getProperty(currentContainer, 'height') as number;
      const finalDuration = heightToDuration(finalHeight);
      const finalEndTime = new Date(currentTask.startTime.getTime() + finalDuration);

      // Calculate the height corresponding to the final (rounded) duration
      const targetHeight = MIN_HEIGHT_PX + finalDuration / (60 * 1000);
      // Set the element height explicitly to match what React will calculate
      gsap.set(currentContainer, { height: targetHeight });

      // Use requestAnimationFrame to ensure updates happen after the browser has painted
      requestAnimationFrame(() => {
        // Update ONLY the task being resized with the final calculated values
        updateTask(currentTask.id, {
          duration: finalDuration,
          nextStartTime: finalEndTime,
        });

        clearResizingState();
        setResizing(false); // Update state
      });
    };

    const dragger = Draggable.create(proxyEl, {
      type: 'y',
      trigger: handleEl,
      cursor: 'ns-resize',
      onPress: onPressHandler,
      onDrag: updateBottom,
      onRelease: onReleaseHandler,
    });

    return () => {
      dragger.forEach((d) => d.kill());
    };
    // Dependencies: Only re-run if the container element itself changes or the task ID changes.
  }, [containerElement, task.id]);
  // --------------------------------

  const calculatedHeight = MIN_HEIGHT_PX + (effectiveDuration || FIVE_MINUTES_MS) / (60 * 1000);
  const containerHeightStyle = {
    height: `${calculatedHeight}px`,
    minHeight: `${MIN_HEIGHT_PX}px`,
  };

  const outerContainerStyle: React.CSSProperties = {
    ...containerHeightStyle,
    position: 'relative',
    opacity: 1, // No longer fades during drag
    zIndex: resizing ? 100 : 'auto', // Boost zIndex only during resize
  };
  const outerContainerClasses = `group relative ${resizing ? 'z-50' : ''}`;

  const shouldShowOverlap = overlapsWithNext && !taskRef.current.completed;
  const isNextTaskFixed = nextTask?.isTimeFixed || false;

  const [showResolveButton, setShowResolveButton] = useState(false);

  const animateTaskMovement = (taskElement: HTMLElement, fromY: number, toY: number) => {
    return gsap.to(taskElement, {
      y: toY - fromY,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        // Reset the transform after animation as the actual position will be updated by React
        gsap.set(taskElement, { clearProps: 'transform' });
      },
    });
  };

  const { addOverlapResolverAction } = useTaskHistoryContext();

  const handleResolveOverlap = () => {
    if (!nextTask?.id || !effectiveEndTime || !nextTask.duration) return;

    // Skip if the next task is time-fixed
    if (nextTask.isTimeFixed) return;

    // Store the previous states for undo/redo
    const currentTaskPreviousState = { ...taskRef.current };
    const nextTaskPreviousState = { ...nextTask };

    // Simply move the next task to start at the end of the current task
    updateTask(nextTask.id, {
      startTime: effectiveEndTime,
      nextStartTime: new Date(effectiveEndTime.getTime() + nextTask.duration),
    });

    // Force a state update to trigger overlap recalculation
    tasksStore.setState((state) => ({
      ...state,
      lastUpdate: new Date().getTime(),
    }));

    // Add to history for undo/redo
    addOverlapResolverAction(
      taskRef.current.id,
      currentTaskPreviousState,
      nextTask.id,
      nextTaskPreviousState,
    );
  };

  const handleResolveAllOverlaps = () => {
    if (!effectiveEndTime) return;

    const tasks = tasksStore.state.tasks;
    const sortedTasks = getSortedTasksForDate(tasks, task.taskDate);
    const currentTaskIndex = sortedTasks.findIndex((t) => t.id === task.id);

    if (currentTaskIndex === -1) return;

    // Store current task's previous state for undo/redo
    const currentTaskPreviousState = { ...taskRef.current };
    // Store affected tasks' previous states
    const affectedTasksPreviousStates = new Map<string, OptimalTask>();

    let currentEndTime = effectiveEndTime;
    let hasOverlappingTasks = true;

    // Update only tasks that are actually overlapping
    for (let i = currentTaskIndex + 1; i < sortedTasks.length && hasOverlappingTasks; i++) {
      const nextTask = sortedTasks[i];
      if (!nextTask.id || nextTask.isTimeFixed) continue; // Skip time-fixed tasks

      // Check if this task overlaps with the current end time
      const nextTaskStart = nextTask.startTime?.getTime() || 0;
      const currentEndTimeMs = currentEndTime.getTime();

      // If there's no overlap with the current task, and it's not the first iteration, stop processing
      if (i > currentTaskIndex + 1 && nextTaskStart >= currentEndTimeMs) {
        hasOverlappingTasks = false;
        continue;
      }

      // Only update if there's an actual overlap
      if (nextTaskStart < currentEndTimeMs) {
        // Store the task's previous state before updating
        affectedTasksPreviousStates.set(nextTask.id, { ...nextTask });

        updateTask(nextTask.id, {
          startTime: currentEndTime,
          nextStartTime: nextTask.duration
            ? new Date(currentEndTime.getTime() + nextTask.duration)
            : undefined,
        });

        if (nextTask.duration) {
          currentEndTime = new Date(currentEndTime.getTime() + nextTask.duration);
        }
      }
    }

    // Force a state update to trigger overlap recalculation
    tasksStore.setState((state) => ({
      ...state,
      lastUpdate: new Date().getTime(),
    }));

    // Find the first affected task for simplicity (in a real app you might want to track all)
    if (affectedTasksPreviousStates.size > 0) {
      const [firstAffectedTaskId, firstAffectedTaskPreviousState] = [
        ...affectedTasksPreviousStates.entries(),
      ][0];

      // Add to history for undo/redo (first affected task only for simplicity)
      addOverlapResolverAction(
        taskRef.current.id,
        currentTaskPreviousState,
        firstAffectedTaskId,
        firstAffectedTaskPreviousState,
      );
    }
  };

  const handleAddBreak = (
    taskId: string,
    startTime: Date,
    duration: number,
    breakType: 'after' | 'during',
  ) => {
    updateTask(taskId, {
      break: {
        type: breakType,
        duration: duration,
        startTime: startTime,
      },
    });
  };

  // Format break duration to readable format
  const formatBreakDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes}m`;
  };

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <div
        ref={handleRefUpdate}
        style={outerContainerStyle}
        className={outerContainerClasses}
        data-task-id={task.id}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="h-full" style={{ position: 'relative' }}>
          <div className="flex h-full items-stretch">
            <div
              ref={timelineNodeRef}
              className={`relative z-10 w-11 flex-shrink-0 transition-shadow duration-150 ease-in-out`}
            >
              <div className="h-full">
                <TimelineItem
                  priority={task.priority}
                  startTime={task.startTime || new Date()}
                  nextStartTime={effectiveEndTime || new Date()}
                  completed={task.completed}
                  strikethrough={task.completed}
                  emoji={task.emoji}
                  taskId={task.id}
                  duration={effectiveDuration}
                  category={task.category}
                  onEditTask={() => onEdit(taskRef.current)}
                  onCompletedChange={() => {
                    toggleTaskCompletion(taskRef.current.id);
                    // Update task form store for sync
                    updateCompletionStatus(!taskRef.current.completed);
                  }}
                  onPriorityChange={(priority) => updateTask(taskRef.current.id, { priority })}
                  isLastItem={isLastItem}
                  fixedHeight={true}
                  nextTaskPriority={nextTask?.priority || 'none'}
                  isFocused={task.isFocused}
                  timeSpent={task.timeSpent || 0}
                  data-id={task.id}
                  isEarliestFocused={isEarliestFocused}
                  isTimeFixed={task.isTimeFixed}
                />
              </div>
            </div>

            <div
              ref={taskCardRef}
              className={`ml-6 min-w-0 flex-grow transition-shadow duration-150 ease-in-out`}
              style={{
                position: 'relative',
              }}
            >
              <TaskItem
                task={taskRef.current}
                onEdit={() => onEdit(taskRef.current)}
                effectiveDuration={effectiveDuration}
              />

              {/* Add BreakWidget for "during" type breaks */}
              {/* Ensure BreakWidget is always visible if active/finished, regardless of parent hover */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                {taskRef.current.startTime && (
                  <BreakWidget
                    taskId={taskRef.current.id}
                    startTime={taskRef.current.startTime}
                    onAddBreak={handleAddBreak}
                    breakType="during"
                    isActive={true}
                    isParentHovered={isHovered}
                  />
                )}
              </div>

              {shouldShowOverlap && (
                <div
                  className="absolute -bottom-5 right-20 z-10 flex items-center"
                  onMouseEnter={() => setShowResolveButton(true)}
                  onMouseLeave={() => setShowResolveButton(false)}
                >
                  {showResolveButton && !isNextTaskFixed && (
                    <div
                      className="mr-2 flex items-center gap-1 transition-all duration-200 ease-in-out"
                      style={{
                        transform: showResolveButton ? 'translateX(0)' : 'translateX(100%)',
                        opacity: showResolveButton ? 1 : 0,
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveAllOverlaps();
                            }}
                            className="flex items-center gap-0.5 rounded bg-blue-500 p-1 text-[10px] text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Resolve all overlaps"
                            tabIndex={0}
                          >
                            <ChevronsDown className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="px-1.5 py-1">
                          <span className="text-[10px]">Resolve all overlaps</span>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveOverlap();
                            }}
                            className="flex items-center gap-0.5 rounded bg-blue-500 p-1 text-[10px] text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Resolve next overlap"
                            tabIndex={0}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="px-1.5 py-1">
                          <span className="text-[10px]">Resolve next overlap</span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Blend
                          className={`h-4 w-4 ${isNextTaskFixed ? 'text-red-500' : 'text-yellow-500'}`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="px-1.5 py-1">
                      <span className="text-[10px]">
                        {isNextTaskFixed ? (
                          <span className="w-[150px]">
                            Can't resolve overlap, <br />
                            next task is time-sensitive
                          </span>
                        ) : (
                          'Time overlap'
                        )}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={bottomHandleRef}
          className={`absolute bottom-0 left-1/2 h-2 w-16 -translate-x-1/2 transform cursor-ns-resize rounded-full transition-colors duration-200 group-hover:bg-gray-600 ${
            resizing ? 'bg-blue-500' : ''
          }`}
          style={{ zIndex: 101 }}
        />
        <div
          ref={bottomProxyRef}
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{ pointerEvents: 'none', visibility: 'hidden' }}
        />
      </div>

      {isLastItem && (
        <div className="pointer-events-none h-[200px]" aria-hidden="true" style={{ opacity: 0 }} />
      )}
    </>
  );
};
