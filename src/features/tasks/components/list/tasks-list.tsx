import { resetForm } from '@/features/tasks/store/task-form.store';
import {
  createNewTask,
  editExistingTask,
  getDefaultEndTime,
  getDefaultStartTime,
  getTasksByDate,
  highlightTask,
  setEditingTaskId,
  setSelectedDate,
  tasksStore,
} from '@/features/tasks/store/tasks.store';
import {
  FIFTEEN_MINUTES_IN_MS,
  ONE_HOUR_IN_MS,
  OptimalTask,
  TWENTY_MINUTES_IN_MS,
  TaskCategory,
  TaskPriority,
} from '@/features/tasks/types/task.types';
import { hasTimeOverlap } from '@/lib/task-utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { addMilliseconds, differenceInMilliseconds, format, parse } from 'date-fns';
import React, { ForwardedRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TasksRoute } from '../../../../routes/routes';
import { GapType } from '../../types';
import { TaskDialog } from '../schedule/dialog';
import { CategorySection } from './category-section';
import { TaskMoveToast } from './task-move-toast';
import { TimelineTaskItemOverlay } from './timeline-task-item-overlay';

interface DayContainerProps {
  // Props if any
}

// Sort tasks within each category by start time
const sortByStartTime = (tasks: OptimalTask[]) => {
  return [...tasks].sort((a, b) => {
    // Use spread to avoid mutating original
    const aTime = a.startTime || new Date(0); // Use startTime Date object
    const bTime = b.startTime || new Date(0);
    return aTime.getTime() - bTime.getTime();
  });
};

// Function to process tasks and insert gap items
const processTasksWithGaps = (tasks: OptimalTask[]): OptimalTask[] => {
  if (!tasks || tasks.length === 0) return []; // Handle empty or null input

  const now = new Date();
  const result: OptimalTask[] = [];
  const sortedTasks = sortByStartTime(tasks.filter((t) => t?.startTime)); // Filter tasks without startTime

  if (sortedTasks.length === 0) return []; // Return empty if no valid tasks

  // Get end of day (23:59:59)
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  result.push(sortedTasks[0]);

  for (let i = 0; i < sortedTasks.length - 1; i++) {
    const currentTask = sortedTasks[i];
    const nextTask = sortedTasks[i + 1];

    // Ensure startTimes exist
    if (!currentTask.startTime || !nextTask.startTime) continue;

    const currentTaskEnd = addMilliseconds(currentTask.startTime, currentTask.duration || 0);
    const gapDuration = differenceInMilliseconds(nextTask.startTime, currentTaskEnd);

    const isCurrentTaskEndInPast = currentTaskEnd < now;
    const isNextTaskStartInPast = nextTask.startTime < now;
    const isNextTaskStartInFuture = nextTask.startTime > now;
    const isPastGap = isCurrentTaskEndInPast && isNextTaskStartInPast;
    const isFutureGap = !isCurrentTaskEndInPast && !isNextTaskStartInPast;
    const hasFreeSlot = gapDuration >= FIFTEEN_MINUTES_IN_MS && gapDuration > 0;
    const hasSmallGap = gapDuration > 0 && gapDuration < FIFTEEN_MINUTES_IN_MS;
    const isBreakGap = isPastGap && gapDuration > TWENTY_MINUTES_IN_MS;

    // Don't add gaps if the current task ends after 23:59
    if (hasFreeSlot && currentTaskEnd <= endOfDay) {
      let gapType: GapType = 'free-slot';
      if (isBreakGap && !isCurrentTaskEndInPast) gapType = 'break';
      else if (hasSmallGap && isFutureGap) gapType = 'get-ready';
      else if (isPastGap) gapType = 'idle-time';

      // Create a deterministic gap ID based on surrounding tasks and gap type
      const gapId = `gap-${currentTask.id}-${nextTask.id}-${gapType}`;
      const gapEndTime = new Date(currentTaskEnd.getTime() + gapDuration);
      const gapItem: OptimalTask = {
        id: gapId,
        title: `Gap - ${gapType}`,
        startTime: currentTaskEnd,
        nextStartTime: nextTask.startTime,
        duration: gapDuration,
        completed: false,
        isFocused: false,
        taskDate: currentTask.taskDate,
        time: `${format(currentTaskEnd, 'HH:mm')}—${format(nextTask.startTime, 'HH:mm')}`,
        priority: 'none',
        category: currentTask.category || 'work',
        isGap: true,
        gapType: gapType,
        gapStartTime: currentTaskEnd,
        gapEndTime: nextTask.startTime,
        subtasks: [],
        progress: 0,
        timeSpent: 0,
      };
      result.push(gapItem);
    }
    result.push(nextTask);
  }

  // Add free slot gap at the end of the day if there's significant time left
  const lastTask = sortedTasks[sortedTasks.length - 1];
  if (lastTask && lastTask.startTime && lastTask.duration) {
    const lastTaskEnd = addMilliseconds(lastTask.startTime, lastTask.duration);

    // Only show end of day gap if last task ends before 23:59
    if (lastTaskEnd <= endOfDay) {
      const remainingTime = differenceInMilliseconds(endOfDay, lastTaskEnd);

      if (remainingTime > ONE_HOUR_IN_MS) {
        const now = new Date();
        const gapType: GapType = lastTaskEnd < now ? 'idle-time' : 'free-slot';
        const gapId = `gap-${lastTask.id}-end-${gapType}`;
        const endGap: OptimalTask = {
          id: gapId,
          title: `Gap - ${gapType}`,
          startTime: lastTaskEnd,
          nextStartTime: endOfDay,
          duration: remainingTime,
          completed: false,
          isFocused: false,
          taskDate: lastTask.taskDate,
          time: `${format(lastTaskEnd, 'HH:mm')}—${format(endOfDay, 'HH:mm')}`,
          priority: 'none',
          category: lastTask.category || 'work',
          isGap: true,
          gapType: gapType,
          gapStartTime: lastTaskEnd,
          gapEndTime: endOfDay,
          subtasks: [],
          progress: 0,
          timeSpent: 0,
        };
        result.push(endGap);
      }
    }
  }

  return result;
};

// Export the handle interface
export interface TasksListHandle {
  setIsCreating: (value: boolean) => void;
}

export const TasksList = React.forwardRef<TasksListHandle, DayContainerProps>(
  (props, ref: ForwardedRef<TasksListHandle>) => {
    // Added explicit type for ref
    const allTasks = useStore(tasksStore, (state) => state.tasks);
    const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
    const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);
    const highlightedTaskId = useStore(tasksStore, (state) => state.highlightedTaskId);
    const search = useSearch({ from: TasksRoute.fullPath });

    // State hooks...
    const [isCreating, setIsCreating] = useState(false);
    const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [startTime, setStartTime] = useState(getDefaultStartTime());
    const [endTime, setEndTime] = useState(getDefaultEndTime());
    const [duration, setDuration] = useState<number>(ONE_HOUR_IN_MS);
    const [dueDate, setDueDate] = useState<Date | undefined>(); // Ensure undefined is allowed
    const [newTask, setNewTask] = useState({
      title: '',
      emoji: '',
      priority: 'none' as TaskPriority,
      category: 'work' as TaskCategory,
    });
    const [showMoveToast, setShowMoveToast] = useState(false);
    const [movedTaskInfo, setMovedTaskInfo] = useState<{
      title: string;
      id: string;
      destinationDate: string | null;
    }>({ title: '', id: '', destinationDate: null });

    // Add state for active drag item
    const [activeDragTask, setActiveDragTask] = useState<OptimalTask | null>(null);

    const prevTasksRef = useRef<OptimalTask[]>([]);
    const navigate = useNavigate();
    const tasksRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    // Effects for date changes, highlighting, keydown...
    React.useEffect(() => {
      if (search.date && search.date !== selectedDate) {
        setSelectedDate(search.date);
      }
    }, [search.date, selectedDate]);

    const basicTasks = React.useMemo(() => {
      return getTasksByDate(selectedDate);
    }, [selectedDate, allTasks]);

    // Memoize tasks with gaps based on the *basicTasks* derived from the current date
    const tasksWithGaps = React.useMemo(() => {
      return processTasksWithGaps(basicTasks);
    }, [basicTasks]);

    // Effect for detecting date changes on edit...
    React.useEffect(() => {
      if (editingTaskId) {
        const currentTask = allTasks.find((task) => task.id === editingTaskId);
        const prevTask = prevTasksRef.current.find((task) => task.id === editingTaskId);
        if (currentTask && prevTask) {
          const currentDateStr = currentTask.taskDate
            ? format(new Date(currentTask.taskDate), 'yyyy-MM-dd')
            : null;
          const prevDateStr = prevTask.taskDate
            ? format(new Date(prevTask.taskDate), 'yyyy-MM-dd')
            : null;
          if (
            currentDateStr &&
            prevDateStr &&
            currentDateStr !== prevDateStr &&
            prevDateStr === selectedDate
          ) {
            setMovedTaskInfo({
              title: currentTask.title || 'Task',
              id: currentTask.id,
              destinationDate: currentDateStr,
            });
            setShowMoveToast(true);
          }
        }
      }
      prevTasksRef.current = [...allTasks];
    }, [allTasks, editingTaskId, selectedDate]);

    // Effect for highlighting after navigation...
    React.useEffect(() => {
      if (movedTaskInfo.id && movedTaskInfo.destinationDate === selectedDate) {
        highlightTask(movedTaskInfo.id);
        setMovedTaskInfo({ title: '', id: '', destinationDate: null });
      }
    }, [selectedDate, movedTaskInfo]);

    // Effect for keyboard shortcut...
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F') navigate({ to: '..' });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // Expose imperative handle...
    React.useImperativeHandle(ref, () => ({
      setIsCreating: (value: boolean) => {
        setIsCreating(value);
        if (value) {
          resetForm();
          setNewTask({ title: '', emoji: '', priority: 'none', category: 'work' });
          setStartTime(getDefaultStartTime());
          setEndTime(getDefaultEndTime());
          setDuration(ONE_HOUR_IN_MS);
          setDueDate(undefined);
          setActiveCategory('work');
        }
      },
    }));

    // Memoize tasksByCategory based on tasksWithGaps
    const tasksByCategory = React.useMemo(() => {
      const sortedTasks = tasksWithGaps; // Already processed with gaps
      const overlaps = new Map<string, boolean>();
      const realTasks = sortedTasks.filter((task) => !task.isGap);
      realTasks.forEach((task, index) => {
        if (index < realTasks.length - 1) {
          overlaps.set(task.id, hasTimeOverlap(task, realTasks[index + 1]));
        }
      });
      return { tasks: sortedTasks, overlaps };
    }, [tasksWithGaps, tasksStore.state.lastUpdate]);

    // Effect to update end time (ensure safety)...
    useEffect(() => {
      if (startTime) {
        try {
          const start = parse(startTime, 'HH:mm', new Date());
          if (!isNaN(start.getTime())) {
            // Check if parsing was successful
            const end = new Date(start.getTime() + duration);
            setEndTime(format(end, 'HH:mm'));
          } else {
            console.error('Invalid start time format:', startTime);
            // Set a default or handle error
          }
        } catch (error) {
          console.error('Error parsing start time:', error);
        }
      }
    }, [startTime, duration]);

    // Event handlers...
    const handleStartEdit = (task: OptimalTask) => {
      if (task.isGap) return;
      setEditingTask(task.id);
      setEditingTaskId(task.id);
    };

    const handleAddTask = (gapStartTime?: Date) => {
      // Renamed for clarity
      resetForm();
      setNewTask({ title: '', emoji: '', priority: 'none', category: 'work' });
      const startTimeToSet = gapStartTime ? format(gapStartTime, 'HH:mm') : getDefaultStartTime();
      setStartTime(startTimeToSet);
      const startDate = gapStartTime || parse(getDefaultStartTime(), 'HH:mm', new Date());
      const endTimeDate = new Date(startDate.getTime() + ONE_HOUR_IN_MS);
      setEndTime(format(endTimeDate, 'HH:mm'));
      setDuration(ONE_HOUR_IN_MS);
      setDueDate(undefined);
      setIsCreating(true);
      setActiveCategory('work');
    };

    // Add handler for drag start
    const handleDragStart = (event: DragStartEvent) => {
      const { active } = event;
      const draggedTaskId = active.id.toString();

      // Find the task being dragged
      const draggedTask = tasksByCategory.tasks.find((task) => task.id === draggedTaskId);

      // Set it as the active drag task
      if (draggedTask) {
        setActiveDragTask(draggedTask);
      }
    };

    // Add handler for drag end (keeps existing functionality, just clears active task)
    const handleDragEnd = (event: DragEndEvent) => {
      // Clear active drag task
      setActiveDragTask(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Use the current tasks from the memoized state, including gaps
      const currentTasksWithGaps = tasksByCategory.tasks;

      const oldIndex = currentTasksWithGaps.findIndex((task) => task.id === active.id);
      const newIndex = currentTasksWithGaps.findIndex((task) => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const movedTask = currentTasksWithGaps[oldIndex];
      const targetTask = currentTasksWithGaps[newIndex];

      // Prevent dragging over or involving gap items
      if (movedTask.isGap || targetTask.isGap) return;

      // 1. Determine the affected range in the current list (with gaps)
      const startIdx = Math.min(oldIndex, newIndex);
      const endIdx = Math.max(oldIndex, newIndex);

      // 2. Find the *original* start time of the block
      //    This is the startTime of the task currently at startIdx
      const anchorTask = currentTasksWithGaps[startIdx];
      // Ensure anchorTask and its startTime exist, provide a robust fallback
      const anchorStartTime = anchorTask?.startTime ? new Date(anchorTask.startTime) : new Date();

      // 3. Perform the array move on a copy of the current list (with gaps)
      let reorderedTasksWithGaps = arrayMove([...currentTasksWithGaps], oldIndex, newIndex);

      // 4. Recalculate times sequentially within the affected block
      let currentTimeCursor = new Date(anchorStartTime); // Use a copy for the cursor
      const finalTasksWithGaps = reorderedTasksWithGaps.map((task, index) => {
        // Only modify tasks within the affected block range
        if (index >= startIdx && index <= endIdx) {
          const updatedTask = { ...task };
          const taskDuration = task.duration || 0; // Handle potentially missing duration

          updatedTask.startTime = new Date(currentTimeCursor); // Assign current cursor time
          const endTime = new Date(currentTimeCursor.getTime() + taskDuration);
          updatedTask.nextStartTime = endTime; // Update next start time (end of current task)

          // Correctly format the time string with both start and end times
          updatedTask.time = `${format(updatedTask.startTime, 'HH:mm')}—${format(endTime, 'HH:mm')}`;

          currentTimeCursor = endTime; // Advance the cursor for the next task

          return updatedTask;
        }
        // Keep tasks outside the range unchanged
        return task;
      });

      // 5. Update the main task store
      tasksStore.setState((state) => {
        // Map over the *original* state.tasks (core tasks without gaps)
        const updatedCoreTasks = state.tasks.map((coreTask) => {
          // Find the corresponding task in our *fully processed* finalTasks list
          const processedVersion = finalTasksWithGaps.find(
            (finalTask) => finalTask.id === coreTask.id,
          );
          // If found (and it's not a gap itself), return the processed version
          // Otherwise, keep the original core task
          return processedVersion && !processedVersion.isGap ? processedVersion : coreTask;
        });
        return { ...state, tasks: updatedCoreTasks };
      });
    };

    // --- Component Return (JSX) ---
    return (
      <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
        <div ref={tasksRef} className="relative mx-auto w-full max-w-[900px] px-10 pb-16">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div className="relative">
              <SortableContext
                items={tasksByCategory.tasks.map((task) => task.id)} // Use IDs from tasksWithGaps
                strategy={verticalListSortingStrategy}
              >
                <CategorySection
                  category="work"
                  tasks={tasksByCategory.tasks} // Pass the list with gaps for rendering
                  onEditTask={handleStartEdit}
                  onAddTask={handleAddTask}
                  overlaps={tasksByCategory.overlaps}
                  highlightedTaskId={highlightedTaskId}
                />
              </SortableContext>
            </div>

            {/* Add DragOverlay with TimelineTaskItemOverlay */}
            {createPortal(
              <DragOverlay
                zIndex={1000}
                dropAnimation={null}
                adjustScale={false}
                modifiers={[]} // No modifiers to avoid interfering with our custom positioning
              >
                {activeDragTask ? <TimelineTaskItemOverlay task={activeDragTask} /> : null}
              </DragOverlay>,
              document.body,
            )}
          </DndContext>
        </div>

        {/* Dialogs and Toast */}
        <TaskDialog
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) setIsCreating(false);
            else {
              /* Logic moved to handleAddTask/imperativeHandle */
            }
          }}
          mode="create"
          initialValues={{
            startTime: startTime, // Use state for initial time
            dueTime: '',
            duration: duration, // Use state for initial duration
            dueDate: dueDate, // Use state for initial due date
            priority: newTask.priority,
            category: newTask.category,
            subtasks: [],
            repetition: 'once',
          }}
          onSubmit={(values) => {
            createNewTask(values);
            setIsCreating(false);
          }}
        />

        {editingTask && (
          <TaskDialog
            open={!!editingTask}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTask(null);
                setEditingTaskId(null);
              }
            }}
            mode="edit"
            initialValues={(() => {
              const task = basicTasks.find((t) => t.id === editingTask);
              if (!task) return {};
              // Populate initial values from the found task
              return {
                title: task.title || '',
                emoji: task.emoji || '',
                startTime: task.time?.split('—')[0] || '',
                dueTime: task.dueTime || '',
                duration: task.duration || ONE_HOUR_IN_MS,
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Ensure Date object
                priority: task.priority || 'none',
                category: task.category || 'work',
                notes: task.notes || '',
                subtasks: task.subtasks || [],
                progress: task.progress || 0,
                repetition: task.repetition || 'once',
              };
            })()}
            onSubmit={(values) => {
              const taskToEdit = basicTasks.find((t) => t.id === editingTask);
              if (taskToEdit) {
                editExistingTask(taskToEdit, values);
              }
              setEditingTask(null);
              setEditingTaskId(null);
            }}
          />
        )}

        <TaskMoveToast
          isOpen={showMoveToast}
          onOpenChange={setShowMoveToast}
          taskTitle={movedTaskInfo.title}
          destinationDate={movedTaskInfo.destinationDate}
          onViewClick={() => {
            if (movedTaskInfo.id && movedTaskInfo.destinationDate) {
              navigate({
                to: '/tasks',
                search: { date: movedTaskInfo.destinationDate, highlight: movedTaskInfo.id },
              });
              // Reset toast info after initiating navigation
              setMovedTaskInfo({ title: '', id: '', destinationDate: null });
              setShowMoveToast(false);
            }
            // Close edit dialog if open
            if (editingTask) {
              setEditingTask(null);
              setEditingTaskId(null);
            }
          }}
        />
      </ScrollArea>
    );
  },
);
