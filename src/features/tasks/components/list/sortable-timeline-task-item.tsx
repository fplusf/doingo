import {
  clearResizingState,
  setResizingState,
  tasksStore,
  toggleTaskCompletion,
  updateTask,
} from '@/features/tasks/store/tasks.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Blend, ChevronsRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ONE_HOUR_IN_MS, OptimalTask } from '../../types';
import { TimelineItem } from '../timeline/timeline';
import { TaskItem } from './task-item';

// Constants
const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const EIGHT_HOURS_MS = 8 * ONE_HOUR_IN_MS; // 8 hours in milliseconds
const MIN_HEIGHT_PX = 58; // Minimum height
const MAX_HEIGHT_PX = MIN_HEIGHT_PX + EIGHT_HOURS_MS / (60 * 1000); // Maximum height = base height + 8 hours in pixels

// GSAP Plugin Registration
gsap.registerPlugin(Draggable);

interface SortableTimelineTaskItemProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
  isLastItem?: boolean;
  nextTask?: OptimalTask;
  overlapsWithNext?: boolean;
}

// Helper function to get tasks sorted by start time for a given date
const getSortedTasksForDate = (tasks: OptimalTask[], date: string): OptimalTask[] => {
  return tasks
    .filter((t) => t.taskDate === date)
    .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));
};

export const SortableTimelineTaskItem = ({
  task,
  onEdit,
  isLastItem = false,
  nextTask,
  overlapsWithNext = false,
}: SortableTimelineTaskItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition, isOver } =
    useSortable({
      id: task.id,
    });

  // Style for the element receiving the dnd-kit transform
  const transformStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    transformOrigin: '0 0',
    height: '100%', // Fill the outer container
    position: 'relative',
  };

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
    setNodeRef(node);
    setContainerElement(node);
  };

  // --- Refs to hold current values for GSAP callbacks ---
  const taskRef = useRef(task);
  const containerElementRef = useRef(containerElement);
  const isDraggingRef = useRef(isDragging);
  const resizingRef = useRef(resizing);

  // Keep refs updated
  useEffect(() => {
    taskRef.current = task;
  }, [task]);
  useEffect(() => {
    containerElementRef.current = containerElement;
  }, [containerElement]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  useEffect(() => {
    resizingRef.current = resizing;
  }, [resizing]);
  // --------------------------------------------------------

  // --- Effect for Initial Height Setting ---
  useEffect(() => {
    const currentContainer = containerElementRef.current;
    // Check refs for dragging and resizing status
    if (currentContainer && !isDraggingRef.current && !resizingRef.current) {
      const currentTask = taskRef.current;
      const initialHeight = MIN_HEIGHT_PX + (currentTask.duration || FIVE_MINUTES_MS) / (60 * 1000);
      // Use overwrite: 'auto' to prevent potential conflicts if GSAP tries setting height multiple times
      gsap.set(currentContainer, { height: initialHeight, overwrite: 'auto' });
    }
    // Dependencies: containerElement state, task duration (for initial calc), isDragging state, resizing state
  }, [containerElement, task.duration, isDragging, resizing]);
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
      // Read latest temp state directly from the imported store's state property
      const tempState = tasksStore.state.resizingState;
      if (
        tempState.taskId === currentTask.id &&
        tempState.temporaryDuration &&
        tempState.temporaryEndTime
      ) {
        // Update ONLY the task being resized
        updateTask(currentTask.id, {
          duration: tempState.temporaryDuration,
          nextStartTime: tempState.temporaryEndTime,
        });
      }
      clearResizingState();
      setResizing(false); // Update state
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging || isOver || resizing ? 100 : 'auto', // Boost zIndex during resize too
  };
  const outerContainerClasses = `group relative ${resizing ? 'z-50' : 'z-auto'}`;

  const shouldShowOverlap = overlapsWithNext && !taskRef.current.completed;

  const [showResolveButton, setShowResolveButton] = useState(false);

  const handleResolveOverlap = () => {
    if (!nextTask || !nextTask.id || !effectiveEndTime) return;

    // Update the next task's start time to be the current task's end time
    updateTask(nextTask.id, {
      startTime: effectiveEndTime,
      // Recalculate the next task's end time based on its duration
      nextStartTime: nextTask.duration
        ? new Date(effectiveEndTime.getTime() + nextTask.duration)
        : undefined,
    });

    // Force a state update to trigger overlap recalculation
    tasksStore.setState((state) => ({
      ...state,
      lastUpdate: new Date().getTime(), // Add a timestamp to force recalculation
    }));
  };

  return (
    <>
      <div
        ref={handleRefUpdate}
        style={outerContainerStyle}
        className={outerContainerClasses}
        data-id={task.id}
      >
        <div style={transformStyle}>
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
                  onCompletedChange={() => toggleTaskCompletion(taskRef.current.id)}
                  onPriorityChange={(priority) => updateTask(taskRef.current.id, { priority })}
                  isLastItem={isLastItem}
                  fixedHeight={true}
                  nextTaskPriority={nextTask?.priority || 'none'}
                  isFocused={task.isFocused}
                  timeSpent={task.timeSpent || 0}
                  {...attributes}
                  data-id={task.id}
                />
              </div>
            </div>

            <div
              ref={taskCardRef}
              className={`ml-6 min-w-0 flex-grow pr-2 transition-shadow duration-150 ease-in-out`}
              style={{
                position: 'relative',
              }}
            >
              <TaskItem
                task={taskRef.current}
                onEdit={() => onEdit(taskRef.current)}
                effectiveDuration={effectiveDuration}
                listeners={listeners}
              />

              {shouldShowOverlap && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute -bottom-5 right-20 z-10 flex items-center gap-1 text-xs text-yellow-500`}
                      onMouseEnter={() => setShowResolveButton(true)}
                      onMouseLeave={() => setShowResolveButton(false)}
                    >
                      <Blend className="h-4 w-4" />
                      {showResolveButton && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveOverlap();
                          }}
                          className="ml-1 flex items-center gap-0.5 rounded bg-blue-500 px-1 py-0.5 text-[10px] text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          aria-label="Resolve time overlap"
                          tabIndex={0}
                        >
                          <span>Resolve</span>
                          <ChevronsRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="px-1.5 py-1">
                    <span className="text-[10px]">Time overlap</span>
                  </TooltipContent>
                </Tooltip>
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
