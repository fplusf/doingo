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
  TaskCategory,
  TaskPriority,
  TWENTY_MINUTES_IN_MS,
} from '@/features/tasks/types/task.types';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
// Temporarily removed DnD imports and functionality for stability and performance optimization
// To re-enable, restore the following imports and their related components:
// import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
// import { restrictToWindowEdges } from '@dnd-kit/modifiers';
// import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { addMilliseconds, differenceInMilliseconds, format, parse } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TasksRoute } from '../../../../routes/routes';
import { TaskDialog } from '../schedule/dialog';
import { CategorySection } from './category-section';
import { TaskMoveToast } from './task-move-toast';

interface DayContainerProps {
  ref?: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

// Helper function to check if two time ranges overlap
const hasTimeOverlap = (task1: OptimalTask, task2: OptimalTask) => {
  if (!task1.time || !task2.time) return false;

  const [start1] = task1.time.split('—');
  const [start2] = task2.time.split('—');

  const [hours1, minutes1] = start1.split(':').map(Number);
  const [hours2, minutes2] = start2.split(':').map(Number);

  const startTime1 = hours1 * 60 + minutes1;
  const startTime2 = hours2 * 60 + minutes2;

  const duration1 = task1.duration || ONE_HOUR_IN_MS;
  const duration2 = task2.duration || ONE_HOUR_IN_MS;

  const endTime1 = startTime1 + duration1 / (60 * 1000); // Convert ms to minutes
  const endTime2 = startTime2 + duration2 / (60 * 1000);

  return startTime1 < endTime2 && endTime1 > startTime2;
};

// Sort tasks within each category by start time
const sortByStartTime = (tasks: OptimalTask[]) => {
  return tasks.sort((a, b) => {
    const aTime = a.time?.split('—')[0] || '00:00';
    const bTime = b.time?.split('—')[0] || '00:00';
    const [aHours, aMinutes] = aTime.split(':').map(Number);
    const [bHours, bMinutes] = bTime.split(':').map(Number);

    // Convert to minutes for easier comparison
    const aInMinutes = aHours * 60 + aMinutes;
    const bInMinutes = bHours * 60 + bMinutes;

    return aInMinutes - bInMinutes;
  });
};

// Function to process tasks and insert gap items
const processTasksWithGaps = (tasks: OptimalTask[]): OptimalTask[] => {
  if (tasks.length <= 1) return tasks;

  const now = new Date();
  const result: OptimalTask[] = [];

  // Sort tasks by start time
  const sortedTasks = sortByStartTime([...tasks]);

  // Add first task
  if (sortedTasks.length > 0) {
    result.push(sortedTasks[0]);
  }

  // Analyze gaps between tasks and insert gap items where needed
  for (let i = 0; i < sortedTasks.length - 1; i++) {
    const currentTask = sortedTasks[i];
    const nextTask = sortedTasks[i + 1];

    if (!currentTask.startTime || !nextTask.startTime) {
      result.push(nextTask);
      continue;
    }

    const currentTaskEnd = currentTask.duration
      ? addMilliseconds(currentTask.startTime, currentTask.duration)
      : currentTask.startTime;

    const gapDuration = differenceInMilliseconds(nextTask.startTime, currentTaskEnd);

    // Check if the gap is in the past, present, or future
    const isCurrentTaskEndInPast = currentTaskEnd < now;
    const isNextTaskStartInPast = nextTask.startTime < now;
    const isNextTaskStartInFuture = nextTask.startTime > now;

    const isPastGap = isCurrentTaskEndInPast && isNextTaskStartInPast;
    const isCurrentGap = isCurrentTaskEndInPast && isNextTaskStartInFuture;
    const isFutureGap = !isCurrentTaskEndInPast && !isNextTaskStartInPast;

    // Check gap size
    const hasLargeGap = gapDuration > ONE_HOUR_IN_MS && gapDuration > 0;
    const hasFreeSlot = gapDuration >= FIFTEEN_MINUTES_IN_MS && gapDuration > 0;
    const hasSmallGap = gapDuration > 0 && gapDuration < FIFTEEN_MINUTES_IN_MS;
    const isBreakGap = isPastGap && gapDuration > TWENTY_MINUTES_IN_MS;

    // Only insert gap for significant gaps (15+ minutes)
    if (hasFreeSlot) {
      // Determine gap type
      let gapType: 'break' | 'free-slot' | 'get-ready' | 'major-strides' = 'free-slot';

      if (isBreakGap) {
        gapType = 'break';
      } else if (hasSmallGap && isFutureGap) {
        gapType = 'get-ready';
      }

      // Create a virtual gap item
      const gapItem: OptimalTask = {
        id: `gap-${uuidv4()}`,
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
      };

      result.push(gapItem);
    }

    // Add the next task
    result.push(nextTask);
  }

  // Check for "major strides" gap after the last task
  if (sortedTasks.length > 0) {
    const lastTask = sortedTasks[sortedTasks.length - 1];

    if (lastTask.startTime && lastTask.duration) {
      const lastTaskEnd = addMilliseconds(lastTask.startTime, lastTask.duration);
      const endOfDay = new Date(lastTaskEnd);
      endOfDay.setHours(22, 0, 0, 0); // Set to 10:00 PM

      const remainingTime = differenceInMilliseconds(endOfDay, lastTaskEnd);
      if (remainingTime > ONE_HOUR_IN_MS) {
        const majorStridesGap: OptimalTask = {
          id: `gap-${uuidv4()}`,
          title: 'Gap - major-strides',
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
          gapType: 'major-strides',
          gapStartTime: lastTaskEnd,
          gapEndTime: endOfDay,
        };

        result.push(majorStridesGap);
      }
    }
  }

  return result;
};

export const TasksList = React.forwardRef<
  { setIsCreating: (value: boolean) => void },
  Omit<DayContainerProps, 'ref'>
>((props, ref) => {
  const allTasks = useStore(tasksStore, (state) => state.tasks);
  const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);
  const highlightedTaskId = useStore(tasksStore, (state) => state.highlightedTaskId);
  const search = useSearch({ from: TasksRoute.fullPath });

  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [duration, setDuration] = useState<number>(ONE_HOUR_IN_MS);
  const [dueDate, setDueDate] = useState<Date>();
  const [newTask, setNewTask] = useState({
    title: '',
    emoji: '',
    priority: 'none' as TaskPriority,
    category: 'work' as TaskCategory,
  });
  // Removed activeId state since drag and drop is disabled
  // Toast state for task moved notification
  const [showMoveToast, setShowMoveToast] = useState(false);
  const [movedTaskInfo, setMovedTaskInfo] = useState<{
    title: string;
    id: string;
    destinationDate: string | null;
  }>({
    title: '',
    id: '',
    destinationDate: null,
  });

  // Keep track of the previous tasks to detect changes
  const prevTasksRef = useRef<OptimalTask[]>([]);

  const navigate = useNavigate();
  const tasksRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Update the selected date when the URL parameter changes
  React.useEffect(() => {
    if (search.date && search.date !== selectedDate) {
      setSelectedDate(search.date);
    }
  }, [search.date, selectedDate]);

  // Get basic tasks without gaps
  const basicTasks = React.useMemo(() => {
    return getTasksByDate(selectedDate);
  }, [selectedDate, allTasks]);

  // Process tasks and insert gaps
  const tasksWithGaps = React.useMemo(() => {
    return processTasksWithGaps(basicTasks);
  }, [basicTasks]);

  // Listen for changes in tasks and detect when a date has been changed
  React.useEffect(() => {
    // Find the task that's currently being edited
    if (editingTaskId) {
      const currentTask = allTasks.find((task) => task.id === editingTaskId);
      const prevTask = prevTasksRef.current.find((task) => task.id === editingTaskId);

      // If we found both the current and previous versions of the task
      if (currentTask && prevTask) {
        const currentDateStr = currentTask.taskDate
          ? format(new Date(currentTask.taskDate), 'yyyy-MM-dd')
          : null;
        const prevDateStr = prevTask.taskDate
          ? format(new Date(prevTask.taskDate), 'yyyy-MM-dd')
          : null;

        // If the date has changed and the task is no longer on the current date
        if (
          currentDateStr &&
          prevDateStr &&
          currentDateStr !== prevDateStr &&
          prevDateStr === selectedDate
        ) {
          // Show toast notification
          setMovedTaskInfo({
            title: currentTask.title || 'Task',
            id: currentTask.id,
            destinationDate: currentDateStr,
          });
          setShowMoveToast(true);
        }
      }
    }

    // Update our reference to the current tasks
    prevTasksRef.current = [...allTasks];
  }, [allTasks, editingTaskId, selectedDate]);

  // Remove the local highlightedTaskId state since we're using the store
  React.useEffect(() => {
    if (movedTaskInfo.id && movedTaskInfo.destinationDate === selectedDate) {
      highlightTask(movedTaskInfo.id);
      setMovedTaskInfo({ title: '', id: '', destinationDate: null });
    }
  }, [selectedDate, movedTaskInfo]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F') {
        navigate({ to: '..' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Expose setIsCreating through ref
  React.useImperativeHandle(ref, () => ({
    setIsCreating: (value: boolean) => {
      setIsCreating(value);
      if (value) {
        setNewTask({
          title: '',
          emoji: '',
          priority: 'none',
          category: 'work',
        });
        setStartTime(getDefaultStartTime());
        setEndTime(getDefaultEndTime());
        setDuration(ONE_HOUR_IN_MS);
        setDueDate(undefined);
        setActiveCategory('work');
      }
    },
  }));

  // Group tasks by category and sort by start time, adding overlap information
  const tasksByCategory = React.useMemo(() => {
    // Use the tasks with gaps
    const sortedTasks = tasksWithGaps;

    // Track overlaps in a Map - exclude gaps from overlap checks
    const overlaps = new Map<string, boolean>();

    // Check for overlaps between consecutive real tasks (not gaps)
    const realTasks = sortedTasks.filter((task) => !task.isGap);
    realTasks.forEach((task, index) => {
      if (index < realTasks.length - 1) {
        overlaps.set(task.id, hasTimeOverlap(task, realTasks[index + 1]));
      }
    });

    return { tasks: sortedTasks, overlaps };
  }, [tasksWithGaps]);

  // Update end time when start time changes
  useEffect(() => {
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = new Date(start.getTime() + duration);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, duration]);

  const handleStartEdit = (task: OptimalTask) => {
    // Don't allow editing gap items
    if (task.isGap) return;

    setEditingTask(task.id);
    setEditingTaskId(task.id);
  };

  const handleAddTask = (startTime?: Date) => {
    // Reset the form state before creating a new task
    resetForm();

    setNewTask({
      title: '',
      emoji: '',
      priority: 'none',
      category: 'work',
    });

    // Format the startTime (if provided) to "HH:mm" string format
    const formattedStartTime = startTime ? format(startTime, 'HH:mm') : getDefaultStartTime();
    setStartTime(formattedStartTime);

    // For end time, add ONE_HOUR_IN_MS to the start time
    if (startTime) {
      const endTimeDate = new Date(startTime.getTime() + ONE_HOUR_IN_MS);
      setEndTime(format(endTimeDate, 'HH:mm'));
    } else {
      setEndTime(getDefaultEndTime());
    }

    setDuration(ONE_HOUR_IN_MS);
    setDueDate(undefined);
    setIsCreating(true);
    setActiveCategory('work');
  };

  return (
    <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
      <div ref={tasksRef} className="relative mx-auto w-full max-w-[900px] px-10 pb-16">
        {/* Single timeline section */}
        <div className="relative">
          <CategorySection
            category="work"
            tasks={tasksByCategory.tasks}
            onEditTask={handleStartEdit}
            onAddTask={handleAddTask}
            overlaps={tasksByCategory.overlaps}
            highlightedTaskId={highlightedTaskId}
          />
        </div>
      </div>

      {/* New Task Dialog */}
      <TaskDialog
        open={isCreating}
        onOpenChange={(open) => {
          if (open) {
            // When opening the dialog, reset the form
            resetForm();

            // Also reset the local task state (redundant but safe)
            setNewTask({
              title: '',
              emoji: '',
              priority: 'none',
              category: activeCategory,
            });
          } else {
            setIsCreating(open);
          }
        }}
        mode="create"
        initialValues={{
          // Don't include title to avoid stale values
          // title: '',
          // notes: '',
          // emoji: '',
          startTime: getDefaultStartTime(),
          dueTime: '',
          duration: ONE_HOUR_IN_MS,
          dueDate: undefined,
          priority: 'none',
          category: activeCategory,
          subtasks: [],
          repetition: 'once',
        }}
        onSubmit={(values) => {
          const taskId = createNewTask(values);
          console.log('Task created with ID:', taskId);
          setIsCreating(false);
        }}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              // Clean up state
              setEditingTask(null);
              setEditingTaskId(null);
            }
          }}
          mode="edit"
          initialValues={(() => {
            // Find the task in the original task list (not the one with gaps)
            const task = basicTasks.find((t) => t.id === editingTask);
            if (!task) return {};

            return {
              title: task.title || '',
              emoji: task.emoji || '',
              startTime: task.time?.split('—')[0] || '',
              dueTime: task.dueTime || '',
              duration: task.duration || ONE_HOUR_IN_MS,
              dueDate: task.dueDate,
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
          }}
        />
      )}

      {/* Task Move Toast */}
      <TaskMoveToast
        isOpen={showMoveToast}
        onOpenChange={setShowMoveToast}
        taskTitle={movedTaskInfo.title}
        destinationDate={movedTaskInfo.destinationDate}
        onViewClick={() => {
          // Store the task ID and trigger highlight after navigation
          if (movedTaskInfo.id) {
            setMovedTaskInfo((prev) => ({ ...prev })); // Keep the info for highlighting after navigation
          }
          // Close the dialog if it's open
          if (editingTask) {
            setEditingTask(null);
          }
        }}
      />
    </ScrollArea>
  );
});
