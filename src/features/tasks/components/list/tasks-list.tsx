import {
  getTasksByDate,
  setEditingTaskId,
  setSelectedDate,
  tasksStore,
  updateTask,
} from '@/features/tasks/store/tasks.store';
import { ONE_HOUR_IN_MS } from '@/features/tasks/types';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format, parse } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { TasksRoute } from '../../../../routes/routes';
import { useTaskFormSubmission } from '../../hooks/use-task-form-submission';
import { OptimalTask, TaskCategory, TaskPriority } from '../../types';
import { TaskDialog } from '../schedule/dialog';
import { CategorySection } from './category-section';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

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
  const search = useSearch({ from: TasksRoute.fullPath });
  const { createNewTask, editTask, getDefaultStartTime, getDefaultEndTime } =
    useTaskFormSubmission(selectedDate);

  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime);
  const [duration, setDuration] = useState<number>(ONE_HOUR_IN_MS);
  const [dueDate, setDueDate] = useState<Date>();
  const [newTask, setNewTask] = useState({
    title: '',
    emoji: '',
    priority: 'none' as TaskPriority,
    category: 'work' as TaskCategory,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
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
        setStartTime(getDefaultStartTime);
        setEndTime(getDefaultEndTime);
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
    tasks.forEach((task) => {
      grouped[task.category || 'work'].push(task);
    });

    // Track overlaps in a Map
    const overlaps = new Map<string, boolean>();

    // Sort tasks and check for overlaps in each category
    Object.keys(grouped).forEach((category) => {
      const sortedTasks = sortByStartTime(grouped[category as TaskCategory]);

      // Check for overlaps
      sortedTasks.forEach((task: OptimalTask, index: number) => {
        if (index < sortedTasks.length - 1) {
          overlaps.set(task.id, hasTimeOverlap(task, sortedTasks[index + 1]));
        }
      });

      grouped[category as TaskCategory] = sortedTasks;
    });

    return { tasks: grouped, overlaps };
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    document.body.style.cursor = '';
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((task) => task.id === active.id);
    const overTask = tasks.find((task) => task.id === over.id);

    if (!activeTask || !overTask) return;

    // If tasks are in the same category, just reorder
    if (activeTask.category === overTask.category) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);

      // Get all existing tasks that are not in the current filtered list
      const otherTasks = allTasks?.filter((task) => task.taskDate !== selectedDate) || [];

      // Update the store with both the reordered current tasks and other tasks
      tasksStore.setState((state) => ({
        ...state,
        tasks: [...otherTasks, ...newTasks],
      }));
    } else {
      // If tasks are in different categories, update the category
      updateTask(activeTask.id, { category: overTask.category });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    document.body.style.cursor = '';
  };

  // Update end time when start time changes
  useEffect(() => {
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = new Date(start.getTime() + duration);
      console.log('end', end);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, duration]);

  const handleStartEdit = (task: OptimalTask) => {
    setEditingTask(task.id);
    setEditingTaskId(task.id);
  };

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  return (
    <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
      <div ref={tasksRef} className="relative mx-auto w-full max-w-[900px] px-10 pb-16">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {Object.entries(tasksByCategory.tasks).map(([category, tasks]) => (
              <div key={category} className="relative">
                <CategorySection
                  category={category as TaskCategory}
                  tasks={tasks}
                  onEditTask={handleStartEdit}
                  onAddTask={() => {
                    setNewTask({
                      title: '',
                      emoji: '',
                      priority: 'none',
                      category: category as TaskCategory,
                    });
                    setStartTime(getDefaultStartTime);
                    setEndTime(getDefaultEndTime);
                    setDuration(ONE_HOUR_IN_MS);
                    setDueDate(undefined);
                    setIsCreating(true);
                    setActiveCategory(category as TaskCategory);
                  }}
                  overlaps={tasksByCategory.overlaps}
                />
              </div>
            ))}
          </SortableContext>

          <DragOverlay
            modifiers={[restrictToWindowEdges]}
            dropAnimation={{
              duration: 500,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeId && activeTask ? (
              <SortableTimelineTaskItem task={activeTask} onEdit={handleStartEdit} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* New Task Dialog */}
      <TaskDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        mode="create"
        initialValues={{
          title: '',
          notes: '',
          emoji: '',
          startTime: getDefaultStartTime(),
          dueTime: '',
          duration: ONE_HOUR_IN_MS,
          dueDate: undefined,
          priority: 'none',
          category: activeCategory,
          subtasks: [],
        }}
        onSubmit={(values) => {
          createNewTask(values, activeCategory);
          setIsCreating(false);
        }}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
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
              editTask(taskToEdit, values);
            }
            setEditingTask(null);
          }}
        />
      )}
    </ScrollArea>
  );
});
