import { tasksStore, toggleTaskCompletion, updateTask } from '@/features/tasks/store/tasks.store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { addMilliseconds, format, formatDistanceStrict } from 'date-fns';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Blend } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ONE_HOUR_IN_MS, OptimalTask } from '../../types';
import { TimelineItem } from '../timeline/timeline';
import { TaskItem } from './task-item';

// Register GSAP plugins
gsap.registerPlugin(Draggable);

// Constants
const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const EIGHT_HOURS_MS = 8 * ONE_HOUR_IN_MS; // 8 hours in milliseconds
const MIN_HEIGHT_PX = 58; // Minimum height
const MAX_HEIGHT_PX = MIN_HEIGHT_PX + EIGHT_HOURS_MS / (60 * 1000); // Maximum height = base height + 8 hours in pixels

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
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

// Helper function to update subsequent tasks
const updateSubsequentTasks = (
  tasks: OptimalTask[],
  currentTaskId: string,
  newEndTime: Date,
): void => {
  const taskDate = format(newEndTime, 'yyyy-MM-dd');
  const sortedTasks = getSortedTasksForDate(tasks, taskDate);

  // Find the index of the current task
  const currentIndex = sortedTasks.findIndex((t) => t.id === currentTaskId);
  if (currentIndex === -1) return;

  // Update all subsequent tasks
  let lastEndTime = newEndTime;
  for (let i = currentIndex + 1; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];
    const newStartTime = new Date(lastEndTime);
    const newNextStartTime = addMilliseconds(newStartTime, task.duration || ONE_HOUR_IN_MS);

    // Update the task's times
    updateTask(task.id, {
      startTime: newStartTime,
      nextStartTime: newNextStartTime,
      time: format(newStartTime, 'HH:mm'),
    });

    lastEndTime = newNextStartTime;
  }
};

export const SortableTimelineTaskItem = ({
  task,
  onEdit,
  isLastItem = false,
  nextTask,
  overlapsWithNext = false,
}: SortableTimelineTaskItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineNodeRef = useRef<HTMLDivElement>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const bottomHandleRef = useRef<HTMLDivElement>(null);
  const bottomProxyRef = useRef<HTMLDivElement>(null);

  const [resizing, setResizing] = useState(false);
  const [currentDuration, setCurrentDuration] = useState<number | undefined>(task.duration);
  const lastBottomY = useRef(0);

  // Format time for display
  const formatTime = (date?: Date): string => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format duration for display
  const formatDuration = (durationMs?: number): string => {
    if (!durationMs) return 'No duration';
    return formatDistanceStrict(new Date(0), new Date(durationMs));
  };

  // Convert height to duration with 5-minute snapping
  const heightToDuration = (heightPx: number): number => {
    // Get minutes from pixels (1px = 1 minute after base height)
    const minutes = Math.max(0, heightPx - MIN_HEIGHT_PX);

    // Convert to milliseconds
    let durationMs = minutes * 60 * 1000;

    // Snap to 5-minute increments
    durationMs = Math.round(durationMs / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;

    // Ensure minimum duration is 5 minutes and maximum is 8 hours
    return Math.max(FIVE_MINUTES_MS, Math.min(EIGHT_HOURS_MS, durationMs));
  };

  // Initial setup
  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial height
    const initialHeight = MIN_HEIGHT_PX + (task.duration || FIVE_MINUTES_MS) / (60 * 1000);
    gsap.set(containerRef.current, { height: initialHeight });
  }, [task.duration]);

  // Setup bottom drag resize
  useEffect(() => {
    if (!bottomHandleRef.current || !containerRef.current || !bottomProxyRef.current) return;

    const updateBottom = function (this: Draggable) {
      if (!containerRef.current) return;

      const diffY = this.y - lastBottomY.current;
      const currentHeight = gsap.getProperty(containerRef.current, 'height') as number;
      const newHeight = Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, currentHeight + diffY));

      gsap.set(containerRef.current, { height: newHeight });
      setCurrentDuration(heightToDuration(newHeight));

      lastBottomY.current = this.y;
    };

    // Create bottom handle dragger
    const dragger = Draggable.create(bottomProxyRef.current, {
      type: 'y',
      trigger: bottomHandleRef.current,
      cursor: 'ns-resize',
      onPress: function (this: Draggable) {
        setResizing(true);
        lastBottomY.current = this.y;
        setCurrentDuration(task.duration);
      },
      onDrag: updateBottom,
      onRelease: function () {
        if (!containerRef.current || !task.startTime) return;

        // Calculate final duration from height
        const finalHeight = gsap.getProperty(containerRef.current, 'height') as number;
        const newDuration = heightToDuration(finalHeight);

        // Calculate new end time
        const newEndTime = new Date(task.startTime.getTime() + newDuration);

        // Update current task duration
        updateTask(task.id, {
          duration: newDuration,
          nextStartTime: newEndTime,
        });

        // Update subsequent tasks
        updateSubsequentTasks(tasksStore.state.tasks, task.id, newEndTime);

        setCurrentDuration(newDuration);
        setResizing(false);
      },
    });

    return () => {
      dragger[0].kill();
    };
  }, [task.id, task.startTime]);

  // Calculate current end time based on current duration
  const currentEndTime =
    task.startTime && currentDuration
      ? new Date(task.startTime.getTime() + currentDuration)
      : undefined;

  return (
    <>
      <div
        ref={containerRef}
        className="group relative mb-0"
        data-id={task.id}
        style={{
          height: MIN_HEIGHT_PX + (task.duration || FIVE_MINUTES_MS) / (60 * 1000),
          zIndex: resizing ? 50 : 'auto',
        }}
      >
        {/* Timeline Item */}
        <div ref={timelineNodeRef} className="absolute left-2 -ml-4 flex h-full w-full">
          <div className="h-full w-full">
            <TimelineItem
              priority={task.priority}
              startTime={task.startTime}
              nextStartTime={
                currentEndTime || new Date(Date.now() + (task.duration || ONE_HOUR_IN_MS))
              }
              completed={task.completed}
              strikethrough={task.completed}
              onPriorityChange={(priority) => updateTask(task.id, { priority })}
              onCompletedChange={() => toggleTaskCompletion(task.id)}
              isLastItem={isLastItem}
              fixedHeight={false}
              emoji={task.emoji}
              onEditTask={() => onEdit(task)}
              taskId={task.id}
              duration={task.duration}
              nextTaskPriority={nextTask?.priority}
            />
          </div>
        </div>

        {/* Task Card */}
        <div ref={taskCardRef} className="ml-16 h-full w-full">
          <TaskItem task={task} onEdit={onEdit} />

          {/* Overlap indicator */}
          {overlapsWithNext && !task.completed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`-bottom-18 absolute right-10 z-10 flex items-center gap-1 text-xs text-yellow-500`}
                >
                  <Blend className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="px-1.5 py-1">
                <span className="text-[10px]">Time overlap</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Bottom resize handle */}
        <div className="absolute inset-x-0 -bottom-1 z-30 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div
            ref={bottomHandleRef}
            className="relative h-[4px] w-[50px] cursor-col-resize rounded-full bg-blue-500/50 transition-colors duration-150 hover:bg-blue-500"
            style={{ transform: 'translateY(50%)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[6px] w-[2px] rounded-full bg-blue-500/80" />
            </div>
          </div>
        </div>

        {/* Invisible proxy element for GSAP dragging */}
        <div ref={bottomProxyRef} className="hidden" />

        {/* Tooltip showing duration while resizing */}
        {resizing && (
          <div className="absolute -bottom-6 right-0 z-50 rounded bg-black/70 px-2 py-1 text-xs text-white">
            <div className="flex flex-col">
              <span>
                {formatTime(task.startTime)} → {formatTime(currentEndTime)}
              </span>
              <span className="text-[10px] text-gray-300">{formatDuration(currentDuration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Invisible placeholder for last item */}
      {isLastItem && (
        <div
          className="pointer-events-none h-[200px]"
          aria-hidden="true"
          style={{
            opacity: 0,
          }}
        />
      )}
    </>
  );
};
