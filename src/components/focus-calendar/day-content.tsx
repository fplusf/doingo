import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Link, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect, useRef } from 'react';
import { TIMELINE_CATEGORIES, TimelineItem } from '../timeline/timeline';
import {
  TaskPriority,
  TaskCategory,
  Task,
  addTask,
  tasksStore,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
} from '@/store/tasks.store';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2, Focus, Smile, ArrowRight } from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { parse, format, intervalToDuration } from 'date-fns';
import { CategoryBadge } from '../timeline/category-line';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskDialog } from '../task-input/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

interface DayContentProps {
  ref: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds
export const CARD_MARGIN_BOTTOM = 30; // margin between cards

const DragHandle = () => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-16 top-1/3 mb-2 h-8 w-8 cursor-grab self-start opacity-0 transition-opacity hover:bg-accent/25 active:cursor-grabbing group-hover:opacity-40"
    >
      <GripVertical className="h-4 w-4" />
    </Button>
  );
};

const SortableTaskItem = ({ task, children }: { task: any; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: '100%',
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group ml-16 w-full">
      <div className="flex w-full items-center justify-items-center">
        <div className="w-full">{children}</div>
        <div {...listeners} className="flex items-center justify-items-center">
          <DragHandle />
        </div>
      </div>
    </div>
  );
};

import { getEmojiBackground } from '@/lib/emoji-utils';

const TaskCard = ({ task, onEdit }: { task: Task; onEdit: (task: any) => void }) => {
  const navigate = useNavigate({ from: '/tasks' });
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHovered && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, navigate, task.id]);

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
            'relative flex h-full w-full flex-col rounded-lg p-2 py-4 pr-6 text-current hover:bg-sidebar hover:shadow-md sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]',
            task.completed && 'opacity-45',
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="flex flex-grow cursor-pointer items-start gap-4"
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
            <div className="flex flex-col gap-2">
              <h3
                className={cn(
                  'mb-4 font-medium',
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

                <Link
                  to={'/tasks/$taskId'}
                  params={{ taskId: task.id }}
                  className="flex h-6 w-32 items-center justify-start rounded-md p-3 text-xs text-muted-foreground hover:bg-gray-700 hover:text-foreground"
                >
                  Open Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </section>
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
          <Focus className="mr-2 h-4 w-4" />
          Focus
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const CategorySection = ({
  category,
  tasks,
  onAddTask,
  onEditTask,
}: {
  category: TaskCategory;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}) => {
  return (
    <div className="relative mb-16 min-h-8" id={`category-${category}`}>
      <CategoryBadge
        id={`category-${category}`}
        label={TIMELINE_CATEGORIES[category].label}
        color={TIMELINE_CATEGORIES[category].color}
        isSticky
      />
      <div className="relative mt-4">
        {/* Task Cards with Timeline Items */}
        <div className="flex flex-col gap-y-3 space-y-0">
          {tasks.map((task) => (
            <div key={task.id} data-id={task.id} className="relative">
              {/* Timeline Item */}
              <div className="absolute -top-1 left-2 -ml-4 w-full">
                <TimelineItem
                  dotColor={task.priority}
                  startTime={task.startTime}
                  nextStartTime={task.nextStartTime}
                  completed={task.completed}
                  strikethrough={task.completed}
                  onPriorityChange={(priority) => updateTask(task.id, { priority })}
                  onCompletedChange={() => toggleTaskCompletion(task.id)}
                />
              </div>

              {/* Task Card */}
              <SortableTaskItem task={task}>
                <div
                  className={cn(
                    'relative h-full',
                    (task.nextStartTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60) > 2
                      ? 'h-[140px] lg:h-[180px]'
                      : 'h-[100px] lg:h-[120px]',
                  )}
                >
                  <TaskCard task={task} onEdit={onEditTask} />
                </div>
              </SortableTaskItem>
            </div>
          ))}
          <Button
            onClick={onAddTask}
            variant="ghost"
            className="z-30 my-10 ml-16 w-[calc(100%-4rem)] justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Add new task
          </Button>
        </div>
      </div>
    </div>
  );
};

const DayContent = React.forwardRef<{ setIsCreating: (value: boolean) => void }, DayContentProps>(
  (props, ref) => {
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
        work: [] as Task[],
        passion: [] as Task[],
        play: [] as Task[],
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
      const duration = intervalToDuration({ start: 0, end: durationMs });
      if (duration.hours && duration.hours > 0) {
        return `${duration.hours} hr${duration.hours > 1 ? 's' : ''}`;
      } else if (duration.minutes && duration.minutes > 0) {
        return `${duration.minutes} min`;
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

    const handleStartEdit = (task: Task) => {
      setEditingTaskId(task.id);
      setNewTask({
        title: task.title,
        notes: task.notes || '',
        emoji: task.emoji || '',
        priority: task.priority,
        category: task.category,
      });
      if (task.time) {
        console.log('Task time: ', task);
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

    console.log(activeTask);

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
              {activeId ? (
                <SortableTaskItem task={tasks.find((t) => t.id === activeId)}>
                  <TaskCard task={tasks.find((t) => t.id === activeId)!} onEdit={handleStartEdit} />
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
  },
);

DayContent.displayName = 'DayContent';

export default DayContent;
