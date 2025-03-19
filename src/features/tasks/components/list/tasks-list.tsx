import {
  clearDraftTask,
  createTaskFromDraft,
  editExistingTask,
  getDefaultEndTime,
  getDefaultStartTime,
  getTasksByDate,
  highlightTask,
  resetDraftTask,
  setEditingTaskId,
  setSelectedDate,
  tasksStore,
} from '@/features/tasks/store/tasks.store';
import {
  ONE_HOUR_IN_MS,
  OptimalTask,
  TaskCategory,
  TaskPriority,
} from '@/features/tasks/types/task.types';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
// Temporarily removed DnD imports and functionality for stability and performance optimization
// To re-enable, restore the following imports and their related components:
// import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
// import { restrictToWindowEdges } from '@dnd-kit/modifiers';
// import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format, parse } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
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

  // Filter tasks based on selected date
  const tasks = React.useMemo(() => {
    return getTasksByDate(selectedDate);
  }, [selectedDate, allTasks]);

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
    const grouped = {
      work: [] as OptimalTask[],
      passion: [] as OptimalTask[],
      play: [] as OptimalTask[],
    };

    // First group tasks by category
    tasks.forEach((task: OptimalTask) => {
      grouped[task.category || 'work'].push(task);
    });

    // Track overlaps in a Map
    const overlaps = new Map<string, boolean>();

    // Sort tasks and check for overlaps in each category
    Object.keys(grouped).forEach((category) => {
      const sortedTasks = sortByStartTime(grouped[category as TaskCategory]);

      // Check for overlaps
      sortedTasks.forEach((task, index: number) => {
        if (index < sortedTasks.length - 1) {
          overlaps.set(task.id, hasTimeOverlap(task, sortedTasks[index + 1]));
        }
      });

      grouped[category as TaskCategory] = sortedTasks;
    });

    return { tasks: grouped, overlaps };
  }, [tasks]);

  // Update end time when start time changes
  useEffect(() => {
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = new Date(start.getTime() + duration);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, duration]);

  const handleStartEdit = (task: OptimalTask) => {
    setEditingTask(task.id);
    setEditingTaskId(task.id);
  };

  return (
    <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
      <div ref={tasksRef} className="relative mx-auto w-full max-w-[900px] px-10 pb-16">
        {/* Temporarily removed DndContext and SortableContext for stability */}
        {Object.entries(tasksByCategory.tasks).map(([category, tasks]) => (
          <div key={category} className="relative">
            <CategorySection
              category={category as TaskCategory}
              tasks={tasks}
              onEditTask={handleStartEdit}
              onAddTask={(startTime) => {
                // Ensure any existing draft is completely reset before creating a new task
                resetDraftTask();

                setNewTask({
                  title: '',
                  emoji: '',
                  priority: 'none',
                  category: category as TaskCategory,
                });

                // Format the startTime (if provided) to "HH:mm" string format
                const formattedStartTime = startTime
                  ? format(startTime, 'HH:mm')
                  : getDefaultStartTime();
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
                setActiveCategory(category as TaskCategory);
              }}
              overlaps={tasksByCategory.overlaps}
              highlightedTaskId={highlightedTaskId}
            />
          </div>
        ))}
      </div>

      {/* New Task Dialog */}
      <TaskDialog
        open={isCreating}
        onOpenChange={(open) => {
          if (open) {
            // When opening the dialog, reset the draft task
            resetDraftTask();
            console.log('Reset draft task when opening dialog');

            // Also reset the local task state (redundant but safe)
            setNewTask({
              title: '',
              emoji: '',
              priority: 'none',
              category: activeCategory,
            });
          } else {
            // When closing the dialog, clear the draft task
            clearDraftTask();
            console.log('Clearing draft task when dialog is closed from TasksList');
          }
          setIsCreating(open);
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
        }}
        onSubmit={(values) => {
          const taskId = createTaskFromDraft();
          console.log('Task created with ID:', taskId);
          // Additional cleanup to ensure draft is cleared
          clearDraftTask();
          setIsCreating(false);
        }}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              // First clear any draft task
              clearDraftTask();
              console.log('Clearing draft task when edit dialog is closed');

              // Then clean up other state
              setEditingTask(null);
              setEditingTaskId(null);
            }
          }}
          mode="edit"
          initialValues={(() => {
            const task = tasks.find((t) => t.id === editingTask);
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
            };
          })()}
          onSubmit={(values) => {
            const taskToEdit = tasks.find((t) => t.id === editingTask);
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
