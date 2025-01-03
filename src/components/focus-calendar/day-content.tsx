import { useSearch } from '@tanstack/react-router';
import React, { TouchEvent, useRef, useState } from 'react';
import { FocusRoute } from '../../routes/routes';
import { CustomTimeline, CustomTimelineItem } from '../timeline/timeline';
import {
  TaskPriority,
  addTask,
  deleteTask,
  tasksStore,
  updateTask,
  toggleTaskCompletion,
} from '@/store/tasks.store';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Check, Calendar } from 'lucide-react';
import { useStore } from '@tanstack/react-store';
import { Input } from '@/components/ui/input';
import { parse } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DayContentProps {}

const DayContent: React.FC<DayContentProps> = () => {
  const search = useSearch({ from: FocusRoute.fullPath });
  const touchStartX = useRef<number | null>(null);
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const [isCreating, setIsCreating] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:30');
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'none' as TaskPriority,
  });

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    touchStartX.current = null;
  };

  const handleAddTask = () => {
    if (!newTask.title || !startTime || !endTime) return;

    const timeString = `${startTime}—${endTime}`;
    const parsedStartTime = parse(startTime, 'HH:mm', new Date());
    const parsedEndTime = parse(endTime, 'HH:mm', new Date());

    const task = {
      title: newTask.title,
      time: timeString,
      startTime: parsedStartTime,
      nextStartTime: parsedEndTime,
      completed: false,
      priority: newTask.priority,
    };

    addTask(task);
    setNewTask({ title: '', priority: 'none' });
    setStartTime('10:00');
    setEndTime('10:30');
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTask({ title: '', priority: 'none' });
    }
  };

  return (
    <div
      className="relative mx-auto h-[calc(100vh-200px)] w-full max-w-[1200px] flex-grow overflow-y-auto rounded-2xl pb-20 pl-6 pr-16"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CustomTimeline>
        {tasks.map((task) => (
          <CustomTimelineItem
            key={task.id}
            dotColor={task.priority}
            time={task.time}
            startTime={task.startTime}
            nextStartTime={task.nextStartTime}
            completed={task.completed}
            strikethrough={task.completed}
            onPriorityChange={(priority) => updateTask(task.id, { priority })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateTask(task.id, { title: task.title })}
                  className="h-8 w-8"
                  aria-label="Edit task"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="h-8 w-8 text-destructive"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => toggleTaskCompletion(task.id)}
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
          </CustomTimelineItem>
        ))}

        {isCreating ? (
          <CustomTimelineItem
            dotColor={newTask.priority}
            time={`${startTime}—${endTime}`}
            startTime={parse(startTime, 'HH:mm', new Date())}
            nextStartTime={parse(endTime, 'HH:mm', new Date())}
            onPriorityChange={(priority) => setNewTask({ ...newTask, priority })}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-grow flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Due to
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-24"
                        />
                        <span>—</span>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="What needs to be done?"
                  className="border-none bg-transparent px-0 focus-visible:ring-0"
                  autoFocus
                />
              </div>
            </div>
          </CustomTimelineItem>
        ) : (
          <Button
            onClick={() => setIsCreating(true)}
            variant="ghost"
            className="ml-12 mt-4 w-full justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Add new task
          </Button>
        )}
      </CustomTimeline>
    </div>
  );
};

export default DayContent;
