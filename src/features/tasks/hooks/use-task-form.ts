import { DurationOption } from '@/components/focus-calendar/duration-picker';
import { TaskCategory, TaskPriority } from '@/store/tasks.store';
import { addMinutes, format, parse } from 'date-fns';
import { useEffect, useState } from 'react';

interface TaskFormValues {
  title: string;
  notes?: string;
  emoji?: string;
  startTime: string;
  endTime: string;
  duration: DurationOption;
  dueDate?: Date;
  priority: TaskPriority;
  category: TaskCategory;
}

interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
}

const defaultDuration: DurationOption = {
  label: '1 hr',
  millis: 60 * 60_000,
};

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

export function useTaskForm({ initialValues, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [emoji, setEmoji] = useState(initialValues?.emoji || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '');
  const [category, setCategory] = useState<TaskCategory>(initialValues?.category || 'work');
  const [duration, setDuration] = useState<DurationOption>(
    initialValues?.duration || defaultDuration,
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate);
  const [priority, setPriority] = useState<TaskPriority | ''>(initialValues?.priority || '');

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (title && !emoji) {
      const suggestedEmoji = getSuggestedEmoji(title, category);
      setEmoji(suggestedEmoji);
    }
  }, [title, category, emoji]);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (startTime && duration) {
      const start = parse(startTime, 'HH:mm', new Date());
      const durationInMinutes = duration.millis / 60_000;
      const end = addMinutes(start, durationInMinutes);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, duration]);

  const handleDurationChange = (value: DurationOption) => {
    setDuration(value);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title) return;

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

  const isValid = Boolean(title && startTime && endTime && duration && priority);

  return {
    values: {
      title,
      notes,
      emoji,
      startTime,
      endTime,
      duration,
      dueDate,
      priority,
      category,
    },
    setters: {
      setTitle,
      setNotes,
      setEmoji,
      setStartTime,
      setDueDate,
      setPriority,
      setCategory,
    },
    handlers: {
      handleDurationChange,
      handleStartTimeChange,
      handleSubmit,
    },
    isValid,
  };
}
