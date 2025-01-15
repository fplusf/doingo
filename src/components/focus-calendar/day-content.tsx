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
} from '@/store/tasks.store';
import { Button } from '@/components/ui/button';
import { Plus, Check, Calendar, GripVertical, X } from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { Input } from '@/components/ui/input';
import { parse, addMinutes, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DurationPicker, durations, DurationOption } from './duration-picker';
import { TimeSelect } from './time-select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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

interface DayContentProps {}

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

const DayContent: React.FC<DayContentProps> = () => {
  const search = useSearch({ from: FocusRoute.fullPath });
  const touchStartX = useRef<number | null>(null);
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const [isCreating, setIsCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('1 hr');
  const [dueDate, setDueDate] = useState<Date>();
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'none' as TaskPriority,
    category: 'work' as TaskCategory,
  });

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

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const durationOption = durations.find((d: DurationOption) => d.label === value);
      if (durationOption) {
        const end = addMinutes(start, durationOption.minutes);
        setEndTime(format(end, 'HH:mm'));
      }
    }
  };

  // Update end time when start time changes
  useEffect(() => {
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const durationOption = durations.find((d: DurationOption) => d.label === duration);
      if (durationOption) {
        const end = addMinutes(start, durationOption.minutes);
        setEndTime(format(end, 'HH:mm'));
      }
    }
  }, [startTime, duration]);

  const handleAddTask = () => {
    if (!newTask.title) return;

    const task = {
      title: newTask.title,
      time: startTime && endTime ? `${startTime}—${endTime}` : '',
      startTime: startTime ? parse(startTime, 'HH:mm', new Date()) : new Date(),
      nextStartTime: endTime ? parse(endTime, 'HH:mm', new Date()) : new Date(),
      dueDate,
      completed: false,
      priority: newTask.priority,
      category: newTask.category,
    };

    addTask(task);
    setNewTask({ title: '', priority: 'none', category: 'work' });
    setStartTime('');
    setEndTime('');
    setDuration('1 hr');
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
        setNewTask({ title: '', priority: 'none', category: 'work' });
        setStartTime('');
        setEndTime('');
        setDuration('1 hr');
        setDueDate(undefined);
      }
    }
  };

  const handleStartEdit = (task: any) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
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
      const diffInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      if (diffInMinutes >= 60) {
        const hours = Math.floor(diffInMinutes / 60);
        setDuration(`${hours} hr${hours > 1 ? 's' : ''}`);
      } else {
        setDuration(`${diffInMinutes} min`);
      }
    } else {
      setDuration('1 hr');
      if (startTime) {
        const start = parse(startTime, 'HH:mm', new Date());
        const end = addMinutes(start, 60); // 1 hour default
        setEndTime(format(end, 'HH:mm'));
      }
    }
    setDueDate(task.dueDate);
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !newTask.title) return;

    const updatedTask = {
      title: newTask.title,
      time: startTime && endTime ? `${startTime}—${endTime}` : '',
      startTime: startTime ? parse(startTime, 'HH:mm', new Date()) : new Date(),
      nextStartTime: endTime ? parse(endTime, 'HH:mm', new Date()) : new Date(),
      dueDate,
      priority: newTask.priority,
      category: newTask.category,
    };

    updateTask(editingTaskId, updatedTask);
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({ title: '', priority: 'none', category: 'work' });
    setStartTime('');
    setEndTime('');
    setDuration('1 hr'); // Reset to default duration
    setDueDate(undefined);
  };

  const renderTaskContent = (task: any) => {
    if (editingTaskId === task.id) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-grow flex-col gap-2">
            <div className="flex items-center gap-2">
              <TimeSelect
                value={startTime}
                endTime={duration ? endTime : undefined}
                onChange={(time) => {
                  setStartTime(time);
                  if (duration) {
                    const start = parse(time, 'HH:mm', new Date());
                    const durationInMinutes = duration.includes('hr')
                      ? parseInt(duration) * 60
                      : parseInt(duration);
                    const end = addMinutes(start, durationInMinutes);
                    setEndTime(format(end, 'HH:mm'));
                  }
                }}
                className="text-muted-foreground"
              />
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="border-none bg-transparent px-0 focus-visible:ring-0"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <DurationPicker value={duration} onValueChange={handleDurationChange} />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-8 hover:bg-green-500/10 hover:text-green-500"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
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
          <h3 className="font-medium">{task.title}</h3>
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
                  {isCreating && activeCategory === 'work' ? (
                    <CustomTimelineItem
                      dotColor={newTask.priority}
                      time={startTime && endTime ? `${startTime}—${endTime}` : 'No time set'}
                      startTime={startTime ? parse(startTime, 'HH:mm', new Date()) : new Date()}
                      nextStartTime={endTime ? parse(endTime, 'HH:mm', new Date()) : new Date()}
                      onPriorityChange={(priority) => setNewTask({ ...newTask, priority })}
                      isNew
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-grow flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <TimeSelect
                              value={startTime}
                              endTime={duration ? endTime : undefined}
                              onChange={(time) => {
                                setStartTime(time);
                                if (duration) {
                                  const start = parse(time, 'HH:mm', new Date());
                                  const durationInMinutes = duration.includes('hr')
                                    ? parseInt(duration) * 60
                                    : parseInt(duration);
                                  const end = addMinutes(start, durationInMinutes);
                                  setEndTime(format(end, 'HH:mm'));
                                }
                              }}
                              className="text-muted-foreground"
                            />
                            <Input
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              onKeyDown={handleKeyDown}
                              placeholder="What needs to be done?"
                              className="border-none bg-transparent px-0 focus-visible:ring-0"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <DurationPicker value={duration} onValueChange={handleDurationChange} />

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due Date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={dueDate}
                                  onSelect={setDueDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </CustomTimelineItem>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsCreating(true);
                        setActiveCategory('work');
                        setNewTask((prev) => ({ ...prev, category: 'work' }));
                      }}
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  )}
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
                  {isCreating && activeCategory === 'passion' ? (
                    <CustomTimelineItem
                      dotColor={newTask.priority}
                      time={startTime && endTime ? `${startTime}—${endTime}` : 'No time set'}
                      startTime={startTime ? parse(startTime, 'HH:mm', new Date()) : new Date()}
                      nextStartTime={endTime ? parse(endTime, 'HH:mm', new Date()) : new Date()}
                      onPriorityChange={(priority) => setNewTask({ ...newTask, priority })}
                      isNew
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-grow flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <TimeSelect
                              value={startTime}
                              endTime={duration ? endTime : undefined}
                              onChange={(time) => {
                                setStartTime(time);
                                if (duration) {
                                  const start = parse(time, 'HH:mm', new Date());
                                  const durationInMinutes = duration.includes('hr')
                                    ? parseInt(duration) * 60
                                    : parseInt(duration);
                                  const end = addMinutes(start, durationInMinutes);
                                  setEndTime(format(end, 'HH:mm'));
                                }
                              }}
                              className="text-muted-foreground"
                            />
                            <Input
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              onKeyDown={handleKeyDown}
                              placeholder="What needs to be done?"
                              className="border-none bg-transparent px-0 focus-visible:ring-0"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <DurationPicker value={duration} onValueChange={handleDurationChange} />

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due Date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={dueDate}
                                  onSelect={setDueDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </CustomTimelineItem>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsCreating(true);
                        setActiveCategory('passion');
                        setNewTask((prev) => ({ ...prev, category: 'passion' }));
                      }}
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  )}
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
                  {isCreating && activeCategory === 'play' ? (
                    <CustomTimelineItem
                      dotColor={newTask.priority}
                      time={startTime && endTime ? `${startTime}—${endTime}` : 'No time set'}
                      startTime={startTime ? parse(startTime, 'HH:mm', new Date()) : new Date()}
                      nextStartTime={endTime ? parse(endTime, 'HH:mm', new Date()) : new Date()}
                      onPriorityChange={(priority) => setNewTask({ ...newTask, priority })}
                      isNew
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-grow flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <TimeSelect
                              value={startTime}
                              endTime={duration ? endTime : undefined}
                              onChange={(time) => {
                                setStartTime(time);
                                if (duration) {
                                  const start = parse(time, 'HH:mm', new Date());
                                  const durationInMinutes = duration.includes('hr')
                                    ? parseInt(duration) * 60
                                    : parseInt(duration);
                                  const end = addMinutes(start, durationInMinutes);
                                  setEndTime(format(end, 'HH:mm'));
                                }
                              }}
                              className="text-muted-foreground"
                            />
                            <Input
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              onKeyDown={handleKeyDown}
                              placeholder="What needs to be done?"
                              className="border-none bg-transparent px-0 focus-visible:ring-0"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <DurationPicker value={duration} onValueChange={handleDurationChange} />

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Due Date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={dueDate}
                                  onSelect={setDueDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </CustomTimelineItem>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsCreating(true);
                        setActiveCategory('play');
                        setNewTask((prev) => ({ ...prev, category: 'play' }));
                      }}
                      variant="ghost"
                      className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add new task
                    </Button>
                  )}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </CustomTimeline>
      </div>
    </ScrollArea>
  );
};

export default DayContent;
