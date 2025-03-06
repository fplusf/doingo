import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { Subtask, TaskCategory, TaskPriority } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { differenceInMilliseconds } from 'date-fns';
import { ClipboardList, Hash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PrioritySelect } from './priority-select';
import { TaskScheduler } from './task-scheduler';

export interface TaskFormValues {
  title: string;
  notes?: string;
  emoji?: string;
  startTime: string;
  endTime: string;
  duration: number;
  dueDate?: Date;
  endDate?: Date;
  priority: TaskPriority;
  category: TaskCategory;
  subtasks?: Subtask[];
  progress?: number;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
}

// Emoji suggestion mappings
const emojiMappings = {
  work: {
    keywords: {
      meeting: '👥',
      email: '📧',
      call: '📞',
      report: '📊',
      presentation: '🎯',
      project: '📋',
      deadline: '⏰',
      review: '👀',
      write: '✍️',
      code: '💻',
      debug: '🐛',
      test: '🧪',
      deploy: '🚀',
    },
    default: '💼',
  },
  passion: {
    keywords: {
      learn: '📚',
      study: '🎓',
      practice: '🎯',
      create: '🎨',
      design: '✨',
      build: '🛠️',
      research: '🔍',
      write: '✍️',
      blog: '📝',
      video: '🎥',
    },
    default: '🌟',
  },
  play: {
    keywords: {
      exercise: '🏃',
      gym: '💪',
      yoga: '🧘',
      game: '🎮',
      read: '📚',
      movie: '🎬',
      music: '🎵',
      cook: '👨‍🍳',
      travel: '✈️',
      relax: '😌',
    },
    default: '🎯',
  },
};

const getSuggestedEmoji = (title: string, category: TaskCategory): string => {
  const lowercaseTitle = title.toLowerCase();
  const categoryMappings = emojiMappings[category];

  for (const [keyword, emoji] of Object.entries(categoryMappings.keywords)) {
    if (lowercaseTitle.includes(keyword)) {
      return emoji;
    }
  }

  return categoryMappings.default;
};

export function TaskDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode = 'create',
  className,
}: TaskDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [title, setTitle] = useState(initialValues?.title || '');
  const [emoji, setEmoji] = useState(initialValues?.emoji || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '');
  const [category, setCategory] = useState<TaskCategory>(initialValues?.category || 'work');
  const [duration, setDuration] = useState<number>(initialValues?.duration || 60 * 60_000); // Default 1 hour
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate);
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialValues?.endDate || initialValues?.dueDate,
  );
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || 'medium');
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialValues?.subtasks || []);
  const [progress, setProgress] = useState<number>(initialValues?.progress || 0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update form state when initialValues or open state changes
  useEffect(() => {
    if (open && initialValues) {
      // Update all form fields based on initialValues
      setTitle(initialValues.title || '');
      setEmoji(initialValues.emoji || '');
      setStartTime(initialValues.startTime || '');
      setEndTime(initialValues.endTime || '');
      setCategory(initialValues.category || 'work');
      setDuration(initialValues.duration || 60 * 60_000);
      setDueDate(initialValues.dueDate);
      setEndDate(initialValues.endDate || initialValues.dueDate);
      setPriority(initialValues.priority || 'medium');
      setSubtasks(initialValues.subtasks || []);
      setProgress(initialValues.progress || 0);
    }
  }, [open, initialValues]);

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (title && !emoji) {
      const suggestedEmoji = getSuggestedEmoji(title, category);
      setEmoji(suggestedEmoji);
    }
  }, [title, category, emoji]);

  // Update progress when subtasks change
  useEffect(() => {
    if (subtasks.length > 0) {
      const completedCount = subtasks.filter((subtask) => subtask.isCompleted).length;
      const newProgress = Math.round((completedCount / subtasks.length) * 100);
      setProgress(newProgress);
    } else {
      setProgress(0);
    }
  }, [subtasks]);

  // Calculate duration when start/end date/time changes
  useEffect(() => {
    if (startTime && endTime && dueDate && endDate) {
      try {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startDateTime = new Date(dueDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        const durationMs = differenceInMilliseconds(endDateTime, startDateTime);

        if (durationMs <= 0) {
          setValidationError('End time cannot be before start time');
        } else {
          setValidationError(null);
          setDuration(durationMs);
        }
      } catch (error) {
        console.error('Error calculating duration:', error);
        setValidationError('Invalid date or time format');
      }
    }
  }, [startTime, endTime, dueDate, endDate]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [title]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(title.length, title.length);
    }
  }, [open, title.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDurationChange = (durationMs: number) => {
    setDuration(durationMs);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
  };

  const handleStartDateChange = (date: Date) => {
    setDueDate(date);
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title) return;

    const values: TaskFormValues = {
      title,
      emoji,
      startTime,
      endTime,
      duration,
      dueDate,
      endDate,
      priority,
      category,
      subtasks,
      progress,
    };

    onSubmit(values);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (title && mode === 'create') {
      const values: TaskFormValues = {
        title,
        emoji,
        startTime,
        endTime,
        duration,
        dueDate,
        endDate,
        priority,
        category,
        subtasks,
        progress,
      };
      onSubmit(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        overlayClassName="bg-black/10"
        onInteractOutside={handleClose}
        onEscapeKeyDown={handleClose}
        className={cn(
          'fixed left-1/2 top-[50%] z-50 w-full max-w-full -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 text-zinc-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] duration-75 dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:max-w-2xl',
          className,
        )}
      >
        <DialogHeader className="absolute -top-10 rounded-md border border-gray-700 bg-card p-2 text-sm">
          <DialogTitle className="text-xs">
            {mode === 'create' ? 'Add task' : 'Edit task'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Add a new task to your timeline' : 'Edit an existing task'}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full rounded-lg bg-card text-card-foreground">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ScrollArea className="h-[150px]">
              <div className="flex items-start gap-2">
                <EmojiPicker emoji={emoji} onEmojiSelect={(newEmoji) => setEmoji(newEmoji)} />
                <Textarea
                  ref={textareaRef}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  placeholder="Task description"
                  className="resize-none border-none bg-transparent px-3 text-xl font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <TaskScheduler
                startTime={startTime}
                endTime={endTime}
                startDate={dueDate}
                endDate={endDate}
                onStartTimeChange={handleStartTimeChange}
                onEndTimeChange={handleEndTimeChange}
                onDurationChange={handleDurationChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                className="text-muted-foreground"
              />

              <div className="flex items-center gap-1">
                <Select
                  value={category}
                  onValueChange={(value: TaskCategory) => setCategory(value)}
                >
                  <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                    <div className="flex items-center">
                      {category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                      {(category === 'passion' || category === 'play') && (
                        <ClipboardList className="mr-1 h-3.5 w-3.5" />
                      )}
                      <SelectValue>
                        {category === 'work' ? 'Work' : category === 'passion' ? 'Passion' : 'Play'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">
                      <div className="flex items-center">
                        <Hash className="mr-1 h-3.5 w-3.5" />
                        Work
                      </div>
                    </SelectItem>
                    <SelectItem value="passion">
                      <div className="flex items-center">
                        <ClipboardList className="mr-1 h-3.5 w-3.5" />
                        Passion
                      </div>
                    </SelectItem>
                    <SelectItem value="play">
                      <div className="flex items-center">
                        <ClipboardList className="mr-1 h-3.5 w-3.5" />
                        Play
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <PrioritySelect value={priority} onValueChange={setPriority} />
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
