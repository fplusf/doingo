'use client';

import { Calendar, Flag, Hash, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TimeSelect } from '@/components/focus-calendar/time-select';
import { DurationPicker } from '@/components/focus-calendar/duration-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { parse, addMinutes, format } from 'date-fns';
import { TaskPriority, TaskCategory } from '@/store/tasks.store';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TaskInputProps {
  initialValues?: {
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
  };
  onSubmit: (values: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    duration: string;
    dueDate?: Date;
    priority: TaskPriority;
    category: TaskCategory;
  }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export default function TaskInput({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Add task',
  className,
}: TaskInputProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '');
  const [duration, setDuration] = useState(initialValues?.duration || '1 hr');
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate);
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || 'none');
  const [category, setCategory] = useState<TaskCategory>(initialValues?.category || 'work');

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const durationInMinutes = value.includes('hr') ? parseInt(value) * 60 : parseInt(value);
      const end = addMinutes(start, durationInMinutes);
      setEndTime(format(end, 'HH:mm'));
    }
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (duration) {
      const start = parse(time, 'HH:mm', new Date());
      const durationInMinutes = duration.includes('hr')
        ? parseInt(duration) * 60
        : parseInt(duration);
      const end = addMinutes(start, durationInMinutes);
      setEndTime(format(end, 'HH:mm'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !duration) return;

    onSubmit({
      title,
      description,
      startTime,
      endTime,
      duration,
      dueDate,
      priority,
      category,
    });
  };

  return (
    <div
      className={cn(
        'w-full max-w-3xl rounded-lg border bg-card p-6 text-card-foreground shadow-sm',
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="border-none bg-transparent px-0 text-xl font-medium placeholder:text-muted-foreground focus-visible:ring-0"
        />

        {/* Description */}
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="resize-none border-none bg-transparent px-0 placeholder:text-muted-foreground focus-visible:ring-0"
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <TimeSelect
            value={startTime}
            endTime={duration ? endTime : undefined}
            onChange={handleStartTimeChange}
            className="text-muted-foreground"
          />
          <DurationPicker value={duration} onValueChange={handleDurationChange} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high'];
              const currentIndex = priorities.indexOf(priority);
              const nextIndex = (currentIndex + 1) % priorities.length;
              setPriority(priorities[nextIndex]);
            }}
          >
            <Flag
              className={cn('mr-2 h-4 w-4', {
                'text-red-500': priority === 'high',
                'text-yellow-500': priority === 'medium',
                'text-blue-500': priority === 'low',
                'text-muted-foreground': priority === 'none',
              })}
            />
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </Button>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={category === 'work' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-9', {
                'bg-secondary text-secondary-foreground': category === 'work',
              })}
              onClick={() => setCategory('work')}
            >
              <Hash className="mr-2 h-4 w-4" />
              Work
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button
              type="button"
              variant={category === 'passion' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-9', {
                'bg-secondary text-secondary-foreground': category === 'passion',
              })}
              onClick={() => setCategory('passion')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Passion
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button
              type="button"
              variant={category === 'play' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-9', {
                'bg-secondary text-secondary-foreground': category === 'play',
              })}
              onClick={() => setCategory('play')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Play
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" className="h-9" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
