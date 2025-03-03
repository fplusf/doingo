import { TaskDialog } from '@/features/tasks/components/schedule/dialog';
import {
  addTask,
  getTasksByDate,
  setSelectedDate,
  tasksStore,
  updateTask,
} from '@/features/tasks/store/tasks.store';
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
import { format, isValid, parse } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { TasksRoute } from '../../../../routes/routes';
import { OptimalTask, TaskCategory, TaskPriority } from '../../types';
import { CategorySection } from './category-section';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

interface DayContainerProps {
  ref?: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds

export const DayContainer = React.forwardRef<
  { setIsCreating: (value: boolean) => void },
  DayContainerProps
>((props, ref) => {
  const allTasks = useStore(tasksStore, (state) => state.tasks);
  const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
  const search = useSearch({ from: TasksRoute.fullPath });
  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState<number>(ONE_HOUR_IN_MS);
  const [dueDate, setDueDate] = useState<Date>();
  const [newTask, setNewTask] = useState({
    title: '',
    notes: '',
    emoji: '',
    priority: 'none' as TaskPriority,
    category: 'work' as TaskCategory,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();
  const tasksRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const initialRenderRef = useRef<boolean>(true);

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
    const categoryPriorityMap = {
      work: 0,
      passion: 1,
      play: 2,
    };

    const sortedTasks = tasks.sort((a, b) => {
      // Sort by category priority
      return categoryPriorityMap[a.category] - categoryPriorityMap[b.category];
    });

    // After first render, set this to false
    initialRenderRef.current = false;

    // Don't manipulate scroll position here to allow router's scroll restoration to work
  }, [tasks]);

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
          notes: '',
          emoji: '',
          priority: 'none',
          category: 'work',
        });
        setStartTime('');
        setEndTime('');
        setDuration(ONE_HOUR_IN_MS);
        setDueDate(undefined);
        setActiveCategory('work');
      }
    },
  }));

  // Group tasks by category
  const tasksByCategory = React.useMemo(() => {
    const grouped = {
      work: [] as OptimalTask[],
      passion: [] as OptimalTask[],
      play: [] as OptimalTask[],
    };

    tasks.forEach((task) => {
      grouped[task.category || 'work'].push(task);
    });

    // Sort tasks within each category - but don't move completed tasks to the top
    Object.keys(grouped).forEach((category) => {
      grouped[category as TaskCategory].sort((a, b) => {
        // We no longer sort completed tasks to the top
        // if (a.completed !== b.completed) {
        //   return a.completed ? -1 : 1;
        // }

        // For uncompleted tasks, we maintain their original position
        return 0;
      });
    });

    return grouped;
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
      const otherTasks = allTasks.filter((task) => task.taskDate !== selectedDate);

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

  const formatDurationForDisplay = (durationMs: number) => {
    if (!durationMs || durationMs <= 0) return '1 hr'; // Default fallback for invalid duration
    const hours = Math.floor(durationMs / (60 * 60 * 1000));
    const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    }
    return '1 hr'; // fallback
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
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      notes: task.notes || '',
      emoji: task.emoji || '',
      priority: task.priority,
      category: task.category,
    });
    if (task.time) {
      const [start, end] = task.time.split('—');
      setStartTime(start);
      setEndTime(end);
      // Calculate duration from start and end time
      const startDate = parse(start, 'HH:mm', new Date());
      const endDate = parse(end, 'HH:mm', new Date());
      const durationMs = task.duration || endDate.getTime() - startDate.getTime();
      setDuration(durationMs);
    } else {
      setDuration(ONE_HOUR_IN_MS);
      if (startTime) {
        const start = parse(startTime, 'HH:mm', new Date());
        const end = new Date(start.getTime() + ONE_HOUR_IN_MS);
        setEndTime(format(end, 'HH:mm'));
      }
    }
    setDueDate(task.dueDate);
  };

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  return (
    <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
      <div ref={tasksRef} className="mx-auto w-full max-w-[900px] px-10 pb-16">
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
            {/* Work Category */}
            <CategorySection
              category="work"
              tasks={tasksByCategory.work}
              onEditTask={handleStartEdit}
              onAddTask={() => {
                setNewTask({
                  title: '',
                  notes: '',
                  emoji: '',
                  priority: 'none',
                  category: 'work',
                });
                setStartTime('');
                setEndTime('');
                setDuration(ONE_HOUR_IN_MS);
                setDueDate(undefined);
                setIsCreating(true);
                setActiveCategory('work');
              }}
            />

            {/* Passion Category */}
            <CategorySection
              category="passion"
              tasks={tasksByCategory.passion}
              onEditTask={handleStartEdit}
              onAddTask={() => {
                setNewTask({
                  title: '',
                  notes: '',
                  emoji: '',
                  priority: 'none',
                  category: 'passion',
                });
                setStartTime('');
                setEndTime('');
                setDuration(ONE_HOUR_IN_MS);
                setDueDate(undefined);
                setIsCreating(true);
                setActiveCategory('passion');
              }}
            />

            {/* Play Category */}
            <CategorySection
              category="play"
              tasks={tasksByCategory.play}
              onEditTask={handleStartEdit}
              onAddTask={() => {
                setNewTask({
                  title: '',
                  notes: '',
                  emoji: '',
                  priority: 'none',
                  category: 'play',
                });
                setStartTime('');
                setEndTime('');
                setDuration(ONE_HOUR_IN_MS);
                setDueDate(undefined);
                setIsCreating(true);
                setActiveCategory('play');
              }}
            />
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

      {/* Create Task Dialog */}
      <TaskDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        mode="create"
        initialValues={{
          title: newTask.title,
          notes: newTask.notes,
          emoji: '',
          startTime,
          endTime,
          duration: {
            label: formatDurationForDisplay(duration),
            millis: duration,
          },
          dueDate,
          priority: newTask.priority,
          category: activeCategory,
        }}
        onSubmit={(values) => {
          // Create base date for today
          const baseDate = new Date();
          let startDate, endDate, durationMs;

          try {
            startDate = values.startTime
              ? parse(values.startTime || '09:00', 'HH:mm', baseDate)
              : baseDate;

            // Use duration if available, otherwise calculate from end time
            if (values.duration?.millis) {
              durationMs = values.duration.millis;
              endDate = new Date(startDate.getTime() + durationMs);
            } else if (values.endTime) {
              endDate = parse(values.endTime, 'HH:mm', baseDate);
              durationMs = endDate.getTime() - startDate.getTime();
            } else {
              durationMs = ONE_HOUR_IN_MS;
              endDate = new Date(startDate.getTime() + durationMs);
            }

            // Ensure we have valid dates
            if (!isValid(startDate)) startDate = baseDate;
            if (!isValid(endDate)) endDate = new Date(startDate.getTime() + durationMs);
            if (durationMs <= 0) durationMs = ONE_HOUR_IN_MS; // Ensure positive duration
          } catch (error) {
            console.error('Error parsing dates:', error);
            // Fallback values
            startDate = baseDate;
            durationMs = ONE_HOUR_IN_MS;
            endDate = new Date(startDate.getTime() + durationMs);
          }

          // Ensure we have a valid time string
          const timeString =
            values.startTime && values.endTime
              ? `${values.startTime}—${values.endTime}`
              : `${format(startDate, 'HH:mm')}—${format(endDate, 'HH:mm')}`;

          const task = {
            title: values.title,
            notes: values.notes,
            emoji: values.emoji,
            time: timeString,
            startTime: startDate,
            nextStartTime: endDate,
            duration: durationMs,
            dueDate: values.dueDate || new Date(),
            priority: values.priority || 'none',
            category: values.category || 'work',
            completed: false,
            isFocused: false,
            taskDate: selectedDate, // Set the task date to the selected date
          };

          addTask(task);

          setNewTask({
            title: '',
            notes: '',
            emoji: '',
            priority: 'none',
            category: activeCategory,
          });

          setStartTime('');
          setEndTime('');
          setDuration(ONE_HOUR_IN_MS);
          setDueDate(undefined);
        }}
      />

      {/* Edit Task Dialog */}
      {editingTaskId && (
        <TaskDialog
          open={!!editingTaskId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTaskId(null);
              // Reset all form values when dialog is closed
              setNewTask({
                title: '',
                notes: '',
                emoji: '',
                priority: 'none',
                category: activeCategory,
              });
              setStartTime('');
              setEndTime('');
              setDuration(ONE_HOUR_IN_MS);
              setDueDate(undefined);
            }
          }}
          mode="edit"
          initialValues={{
            title: newTask.title,
            notes: newTask.notes,
            emoji: newTask.emoji,
            startTime: startTime || '',
            endTime: endTime || '',
            duration: {
              label: formatDurationForDisplay(duration),
              millis: duration,
            },
            dueDate,
            priority: newTask.priority,
            category: newTask.category,
          }}
          onSubmit={(values) => {
            // Create base date for today
            const baseDate = new Date();
            let startDate, endDate, durationMs;

            try {
              startDate = values.startTime ? parse(values.startTime, 'HH:mm', baseDate) : baseDate;
              endDate = values.endTime
                ? parse(values.endTime, 'HH:mm', baseDate)
                : new Date(baseDate.getTime() + ONE_HOUR_IN_MS);

              // Ensure we have valid dates
              if (!isValid(startDate)) startDate = baseDate;
              if (!isValid(endDate)) endDate = new Date(startDate.getTime() + ONE_HOUR_IN_MS);

              // Calculate duration
              durationMs = endDate.getTime() - startDate.getTime();
              if (durationMs <= 0) durationMs = ONE_HOUR_IN_MS; // Ensure positive duration
            } catch (error) {
              console.error('Error parsing dates:', error);
              // Fallback values
              startDate = baseDate;
              endDate = new Date(baseDate.getTime() + ONE_HOUR_IN_MS);
              durationMs = ONE_HOUR_IN_MS;
            }

            // Ensure we have a valid time string
            const timeString =
              values.startTime && values.endTime
                ? `${values.startTime}—${values.endTime}`
                : `${format(startDate, 'HH:mm')}—${format(endDate, 'HH:mm')}`;

            updateTask(editingTaskId, {
              title: values.title,
              notes: values.notes,
              emoji: values.emoji,
              time: timeString,
              startTime: startDate,
              nextStartTime: endDate,
              duration: durationMs,
              dueDate: values.dueDate || new Date(),
              priority: values.priority,
              category: values.category,
            });

            setEditingTaskId(null);
            setNewTask({
              title: '',
              notes: '',
              emoji: '',
              priority: 'none',
              category: activeCategory,
            });
            setStartTime('');
            setEndTime('');
            setDuration(ONE_HOUR_IN_MS);
            setDueDate(undefined);
          }}
        />
      )}
    </ScrollArea>
  );
});
