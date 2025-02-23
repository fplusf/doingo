import { TaskDialog } from '@/features/tasks/components/schedule/dialog';
import { addTask, tasksStore, updateTask } from '@/features/tasks/store/tasks.store';
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
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format, parse } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { OptimalTask, TaskCategory, TaskPriority } from '../../types';
import { CategorySection } from './category-section';
import { SortableTaskItem } from './sortable-task-item';
import { TaskCard } from './task-card';

interface DayContainerProps {
  ref?: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds

export const DayContainer = React.forwardRef<
  { setIsCreating: (value: boolean) => void },
  DayContainerProps
>((props, ref) => {
  const tasks = useStore(tasksStore, (state) => state.tasks);
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

  React.useEffect(() => {
    const categoryPriorityMap = {
      work: 0,
      passion: 1,
      play: 2,
    };

    const firstUncompletedTask = tasks
      .sort((a, b) => {
        return categoryPriorityMap[a.category] - categoryPriorityMap[b.category];
      })
      .find((task) => !task.completed);

    if (!firstUncompletedTask) return;

    if (firstUncompletedTask.id && tasksRef.current) {
      const activeTaskElement = tasksRef.current.querySelector(
        `[data-id="${firstUncompletedTask.id}"]`,
      );
      const activeTaskPosition = activeTaskElement?.getBoundingClientRect();

      // Scroll to the active task
      if (viewportRef.current && activeTaskPosition && activeTaskElement) {
        const viewportRect = viewportRef.current.getBoundingClientRect();
        const scrollOffset = activeTaskPosition.top - viewportRect.top - 100; // Add 100px padding from top
        viewportRef.current.scrollTo({
          top: viewportRef.current.scrollTop + scrollOffset,
        });
      }
    }
  }, []);

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
      tasksStore.setState((state) => ({ tasks: newTasks }));
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
      <div ref={tasksRef} className="mx-auto w-full max-w-[1200px] px-10 pb-16">
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
              <SortableTaskItem task={activeTask}>
                <TaskCard task={activeTask} onEdit={handleStartEdit} />
              </SortableTaskItem>
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
          const startDate = parse(values.startTime || '09:00', 'HH:mm', new Date());
          const endDate = new Date(
            startDate.getTime() + (values.duration?.millis || ONE_HOUR_IN_MS),
          );
          const durationMs = values.duration?.millis || ONE_HOUR_IN_MS;

          const task = {
            title: values.title,
            notes: values.notes,
            emoji: values.emoji,
            time: `${values.startTime}—${values.endTime}`,
            startTime: startDate,
            nextStartTime: endDate,
            duration: durationMs,
            dueDate: values.dueDate || new Date(),
            priority: values.priority || 'none',
            category: values.category || 'work',
            completed: false,
            isFocused: false,
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
            if (!open) setEditingTaskId(null);
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
            const startDate = parse(values.startTime, 'HH:mm', new Date());
            const endDate = parse(values.endTime, 'HH:mm', new Date());
            const durationMs = endDate.getTime() - startDate.getTime();

            updateTask(editingTaskId, {
              title: values.title,
              notes: values.notes,
              emoji: values.emoji,
              time: `${values.startTime}—${values.endTime}`,
              startTime: startDate,
              nextStartTime: endDate,
              duration: durationMs,
              dueDate: values.dueDate,
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
