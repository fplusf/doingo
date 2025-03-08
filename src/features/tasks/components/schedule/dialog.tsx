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
import { ClipboardList, Hash } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TaskFormProvider, useTaskForm } from '../../context/task-form-context';
import { PrioritySelect } from './priority-select';
import { TaskScheduler } from './task-scheduler';

export interface TaskFormValues {
  title: string;
  notes?: string;
  emoji?: string;
  startDate?: Date;
  startTime: string;
  duration: number;
  dueDate?: Date;
  dueTime: string;
  priority: TaskPriority;
  category: TaskCategory;
  subtasks?: Subtask[];
  progress?: number;
  repetition?: 'once' | 'daily' | 'weekly' | 'custom';
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

function TaskDialogContent({
  onSubmit,
  mode = 'create',
  className,
  onOpenChange,
}: {
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { values, updateValue, isValid } = useTaskForm();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (values.title && !values.emoji) {
      const suggestedEmoji = getSuggestedEmoji(values.title, values.category || 'work');
      updateValue('emoji', suggestedEmoji);
    }
  }, [values.title, values.category]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [values.title]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(values.title?.length || 0, values.title?.length || 0);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!values.title) return;

    if (isValid) {
      onSubmit(values);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (values.title && mode === 'create') {
      onSubmit(values);
    }
    onOpenChange(false);
  };

  return (
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
              <EmojiPicker
                emoji={values.emoji || ''}
                onEmojiSelect={(newEmoji) => updateValue('emoji', newEmoji)}
              />
              <Textarea
                ref={textareaRef}
                value={values.title || ''}
                onChange={(e) => updateValue('title', e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Task description"
                className="resize-none border-none bg-transparent px-3 text-xl font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </ScrollArea>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <TaskScheduler className="text-muted-foreground" />

            <div className="flex items-center gap-1">
              <Select
                value={values.category || 'work'}
                onValueChange={(value: TaskCategory) => updateValue('category', value)}
              >
                <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                  <div className="flex items-center">
                    {values.category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                    {(values.category === 'passion' || values.category === 'play') && (
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    )}
                    <SelectValue>
                      {values.category === 'work'
                        ? 'Work'
                        : values.category === 'passion'
                          ? 'Passion'
                          : 'Play'}
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

              <PrioritySelect
                value={values.priority || 'medium'}
                onValueChange={(priority) => updateValue('priority', priority)}
              />
            </div>
          </div>
        </form>
      </div>
    </DialogContent>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  mode = 'create',
  className,
}: TaskDialogProps) {
  return (
    <Dialog open={open}>
      <TaskFormProvider initialValues={initialValues}>
        <TaskDialogContent
          onSubmit={onSubmit}
          mode={mode}
          className={className}
          onOpenChange={onOpenChange}
        />
      </TaskFormProvider>
    </Dialog>
  );
}
