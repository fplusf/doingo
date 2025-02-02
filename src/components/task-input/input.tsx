import { Hash, ClipboardList } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TaskScheduler } from '@/components/focus-calendar/task-scheduler';
import { DurationOption } from '@/components/focus-calendar/duration-picker';
import { parse, addMinutes, format } from 'date-fns';
import { TaskPriority, TaskCategory } from '@/store/tasks.store';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiPicker } from '@/components/emoji/emoji-picker';
interface TaskInputProps {
  initialValues?: {
    title: string;
    notes?: string;
    emoji?: string;
    startTime?: string;
    endTime?: string;
    duration?: DurationOption;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
  };
  onSubmit: (values: {
    title: string;
    notes?: string;
    emoji?: string;
    startTime: string;
    endTime: string;
    duration: DurationOption;
    dueDate?: Date;
    priority: TaskPriority;
    category: TaskCategory;
  }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

//TODO: Use the local AI to suggest an emoji based on the title and category
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

export default function TaskInput({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Add task',
  className,
}: TaskInputProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [emoji, setEmoji] = useState(initialValues?.emoji || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '');
  const [category, setCategory] = useState<TaskCategory>(initialValues?.category || 'work');

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (title && !emoji) {
      const suggestedEmoji = getSuggestedEmoji(title, category);
      setEmoji(suggestedEmoji);
    }
  }, [title, category]);

  const [duration, setDuration] = useState<DurationOption>(
    initialValues?.duration || {
      label: '1 hr',
      millis: 60 * 60_000,
    },
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate);
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || 'none');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Adjust height on initial render and when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [title]);

  const handleDurationChange = (value: DurationOption) => {
    setDuration(value);
    if (startTime) {
      const start = parse(startTime, 'HH:mm', new Date());
      const durationInMinutes = value.millis / 60_000;
      const end = addMinutes(start, durationInMinutes);
      setEndTime(format(end, 'HH:mm'));
    }
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (duration) {
      const start = parse(time, 'HH:mm', new Date());
      const durationInMinutes = duration.millis / 60_000;
      const end = addMinutes(start, durationInMinutes);
      setEndTime(format(end, 'HH:mm'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !duration) return;

    onSubmit({
      title,
      notes,
      emoji,
      startTime,
      endTime,
      duration,
      dueDate,
      priority,
      category,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!title || !startTime || !endTime || !duration) return;

      onSubmit({
        title,
        notes,
        emoji,
        startTime,
        endTime,
        duration,
        dueDate,
        priority,
        category,
      });

      // Clear the input after submission
      setTitle('');
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm',
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Action Bar */}
        <div className="flex items-center gap-1.5 border-t border-border pt-4">
          <TaskScheduler
            startTime={startTime}
            duration={duration}
            startDate={dueDate ? new Date(dueDate) : undefined}
            onStartTimeChange={handleStartTimeChange}
            onDurationChange={handleDurationChange}
            onStartDateChange={setDueDate}
            className="text-muted-foreground"
          />

          <div className="flex items-center gap-1">
            <Select value={category} onValueChange={(value: TaskCategory) => setCategory(value)}>
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

            {/* TODO: Show priority only within the details page */}
            {/* <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
              <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                <div className="flex items-center">
                  <div
                    className="mr-1.5 h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        priority === 'high'
                          ? '#ef4444'
                          : priority === 'medium'
                            ? '#eab308'
                            : priority === 'low'
                              ? '#3b82f6'
                              : '#64748b',
                    }}
                  />
                  <SelectValue>
                    {priority === 'high'
                      ? 'High'
                      : priority === 'medium'
                        ? 'Medium'
                        : priority === 'low'
                          ? 'Low'
                          : 'None'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center">
                    <div className="mr-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                    High
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center">
                    <div className="mr-1.5 h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center">
                    <div className="mr-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Low
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center">
                    <div className="mr-1.5 h-2.5 w-2.5 rounded-full bg-slate-500" />
                    None
                  </div>
                </SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>
      </form>
    </div>
  );
}
