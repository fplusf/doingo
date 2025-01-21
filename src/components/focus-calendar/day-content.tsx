import { useSearch } from '@tanstack/react-router';
import React, { TouchEvent, useRef, useState, useEffect } from 'react';
import { FocusRoute } from '../../routes/routes';
import { CustomTimeline, CustomTimelineItem, TIMELINE_CATEGORIES } from '../timeline/timeline';
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
import { Plus, Check, GripVertical, Trash2, Focus } from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { parse, format, intervalToDuration } from 'date-fns';
import { CategoryLine } from '../timeline/category-line';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface DayContentProps {
  ref: React.RefObject<{ setIsCreating: (value: boolean) => void }>;
}

const ONE_HOUR_IN_MS = 3600000; // 1 hour in milliseconds

const DragHandle = () => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-10 mb-7 h-8 w-8 cursor-grab opacity-0 transition-opacity hover:bg-accent/25 active:cursor-grabbing group-hover:opacity-40"
    >
      <GripVertical className="h-4 w-4" />
    </Button>
  );
};

const SortableTaskItem = ({ task, children }: { task: any; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group w-full">
      <div className="flex w-full items-center">
        <div {...listeners} className="flex items-center">
          <DragHandle />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

const DayContent = React.forwardRef<{ setIsCreating: (value: boolean) => void }, DayContentProps>(
  (props, ref) => {
    const search = useSearch({ from: FocusRoute.fullPath });
    const touchStartX = useRef<number | null>(null);
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
      description: '',
      priority: 'none' as TaskPriority,
      category: 'work' as TaskCategory,
    });

    // Expose setIsCreating through ref
    React.useImperativeHandle(ref, () => ({
      setIsCreating: (value: boolean) => {
        setIsCreating(value);
        if (value) {
          setNewTask({
            title: '',
            description: '',
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
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
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

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      touchStartX.current = null;
    };

    const formatDurationForDisplay = (durationMs: number) => {
      const duration = intervalToDuration({ start: 0, end: durationMs });
      if (duration.hours && duration.hours > 0) {
        return `${duration.hours} hr${duration.hours > 1 ? 's' : ''}`;
      } else if (duration.minutes && duration.minutes > 0) {
        return `${duration.minutes} min`;
      }
      return '1 hr'; // fallback
    };

    const handleDurationChange = (value: string) => {
      // Convert the duration string to milliseconds
      const durationInMinutes = value.includes('hr') ? parseInt(value) * 60 : parseInt(value);
      const durationMs = durationInMinutes * 60 * 1000;
      setDuration(durationMs);

      if (startTime) {
        const start = parse(startTime, 'HH:mm', new Date());
        const end = new Date(start.getTime() + durationMs);
        setEndTime(format(end, 'HH:mm'));
      }
    };

    // Update end time when start time changes
    useEffect(() => {
      if (startTime) {
        const start = parse(startTime, 'HH:mm', new Date());
        const end = new Date(start.getTime() + duration);
        setEndTime(format(end, 'HH:mm'));
      }
    }, [startTime, duration]);

    const handleAddTask = () => {
      if (!newTask.title) return;

      const startDate = startTime ? parse(startTime, 'HH:mm', new Date()) : new Date();
      const endDate = endTime
        ? parse(endTime, 'HH:mm', new Date())
        : new Date(startDate.getTime() + duration);
      const durationMs = endDate.getTime() - startDate.getTime();

      const task = {
        title: newTask.title,
        description: newTask.description,
        time: startTime && endTime ? `${startTime}—${endTime}` : '',
        startTime: startDate,
        nextStartTime: endDate,
        duration: durationMs,
        dueDate,
        completed: false,
        priority: newTask.priority,
        category: newTask.category,
      };

      addTask(task);
      setNewTask({ title: '', description: '', priority: 'none', category: 'work' });
      setStartTime('');
      setEndTime('');
      setDuration(ONE_HOUR_IN_MS);
      setDueDate(undefined);
      setIsCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (editingTaskId) {
          handleSaveEdit();
        } else {
          handleAddTask();
        }
      } else if (e.key === 'Escape') {
        if (editingTaskId) {
          handleCancelEdit();
        } else {
          setIsCreating(false);
          setNewTask({ title: '', description: '', priority: 'none', category: 'work' });
          setStartTime('');
          setEndTime('');
          setDuration(ONE_HOUR_IN_MS);
          setDueDate(undefined);
        }
      }
    };

    const handleStartEdit = (task: any) => {
      setEditingTaskId(task.id);
      setNewTask({
        title: task.title,
        description: task.description || '',
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
        const durationMs = endDate.getTime() - startDate.getTime();
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

    const handleSaveEdit = () => {
      if (!editingTaskId || !newTask.title) return;

      const startDate = startTime ? parse(startTime, 'HH:mm', new Date()) : new Date();
      const endDate = endTime
        ? parse(endTime, 'HH:mm', new Date())
        : new Date(startDate.getTime() + duration);
      const durationMs = endDate.getTime() - startDate.getTime();

      const updatedTask = {
        title: newTask.title,
        description: newTask.description,
        time: startTime && endTime ? `${startTime}—${endTime}` : '',
        startTime: startDate,
        nextStartTime: endDate,
        duration: durationMs,
        dueDate,
        priority: newTask.priority,
        category: newTask.category,
      };

      updateTask(editingTaskId, updatedTask);
      handleCancelEdit();
    };

    const handleCancelEdit = () => {
      setEditingTaskId(null);
      setNewTask({ title: '', description: '', priority: 'none', category: 'work' });
      setStartTime('');
      setEndTime('');
      setDuration(ONE_HOUR_IN_MS);
      setDueDate(undefined);
    };

    const renderTaskContent = (task: any) => {
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="flex items-center justify-between">
              <div
                className="flex flex-grow cursor-pointer items-center gap-2"
                onClick={() => handleStartEdit(task)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartEdit(task);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                </div>
                {task.dueDate && (
                  <span className="text-sm text-muted-foreground">
                    Due: {format(task.dueDate, 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }
                  }}
                  className={`ml-4 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-600 transition-colors hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    task.completed ? 'border-green-500 bg-green-500' : ''
                  }`}
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label="Toggle task completion"
                  tabIndex={0}
                >
                  {task.completed && <Check className="h-4 w-4 text-white" />}
                </button>
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

    return (
      <ScrollArea className="relative h-[calc(100vh-200px)] w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-10">
          <CustomTimeline>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* Work Category */}
                <div className="relative mb-16 min-h-8 w-full" id="category-work">
                  <CategoryLine
                    id="category-work"
                    label={TIMELINE_CATEGORIES.work.label}
                    color={TIMELINE_CATEGORIES.work.color}
                    isSticky
                  />
                  <div className="mt-4">
                    {tasksByCategory.work.map((task) => (
                      <SortableTaskItem key={task.id} task={task}>
                        <CustomTimelineItem
                          dotColor={task.priority}
                          time={task.time}
                          startTime={task.startTime}
                          nextStartTime={task.nextStartTime}
                          completed={task.completed}
                          strikethrough={task.completed}
                          onPriorityChange={(priority) => updateTask(task.id, { priority })}
                        >
                          {renderTaskContent(task)}
                        </CustomTimelineItem>
                      </SortableTaskItem>
                    ))}
                    <Button
                      onClick={() => {
                        setNewTask({
                          title: '',
                          description: '',
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
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  </div>
                </div>

                {/* Passion Category */}
                <div className="relative mb-16 min-h-8" id="category-passion">
                  <CategoryLine
                    id="category-passion"
                    label={TIMELINE_CATEGORIES.passion.label}
                    color={TIMELINE_CATEGORIES.passion.color}
                    isSticky
                  />
                  <div className="mt-4">
                    {tasksByCategory.passion.map((task) => (
                      <SortableTaskItem key={task.id} task={task}>
                        <CustomTimelineItem
                          dotColor={task.priority}
                          time={task.time}
                          startTime={task.startTime}
                          nextStartTime={task.nextStartTime}
                          completed={task.completed}
                          strikethrough={task.completed}
                          onPriorityChange={(priority) => updateTask(task.id, { priority })}
                        >
                          {renderTaskContent(task)}
                        </CustomTimelineItem>
                      </SortableTaskItem>
                    ))}
                    <Button
                      onClick={() => {
                        setNewTask({
                          title: '',
                          description: '',
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
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  </div>
                </div>

                {/* Play Category */}
                <div className="relative mb-16 min-h-[calc(100vh-200px)]" id="category-play">
                  <CategoryLine
                    id="category-play"
                    label={TIMELINE_CATEGORIES.play.label}
                    color={TIMELINE_CATEGORIES.play.color}
                    isSticky
                  />
                  <div className="mt-4">
                    {tasksByCategory.play.map((task) => (
                      <SortableTaskItem key={task.id} task={task}>
                        <CustomTimelineItem
                          dotColor={task.priority}
                          time={task.time}
                          startTime={task.startTime}
                          nextStartTime={task.nextStartTime}
                          completed={task.completed}
                          strikethrough={task.completed}
                          onPriorityChange={(priority) => updateTask(task.id, { priority })}
                        >
                          {renderTaskContent(task)}
                        </CustomTimelineItem>
                      </SortableTaskItem>
                    ))}
                    <Button
                      onClick={() => {
                        setNewTask({
                          title: '',
                          description: '',
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
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </CustomTimeline>
        </div>

        {/* Create Task Dialog */}
        <TaskDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          mode="create"
          initialValues={{
            title: newTask.title,
            description: newTask.description,
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
            const startDate = parse(values.startTime, 'HH:mm', new Date());
            const endDate = parse(values.endTime, 'HH:mm', new Date());
            const durationMs = endDate.getTime() - startDate.getTime();

            const task = {
              title: values.title,
              description: values.description,
              time: `${values.startTime}—${values.endTime}`,
              startTime: startDate,
              nextStartTime: endDate,
              duration: durationMs,
              dueDate: values.dueDate,
              completed: false,
              priority: values.priority,
              category: values.category,
            };

            addTask(task);
            setNewTask({ title: '', description: '', priority: 'none', category: activeCategory });
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
              description: newTask.description,
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
                description: values.description,
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
                description: '',
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
