import { Subtask, TaskCategory, TaskPriority } from '@/features/tasks/types';
import { differenceInMilliseconds } from 'date-fns';
import { useEffect, useState } from 'react';

interface TaskFormValues {
  title: string;
  notes?: string;
  emoji?: string;
  startTime: string;
  endTime: string;
  dueDate?: Date;
  endDate?: Date;
  duration: number; // Duration in milliseconds, calculated from start and end time
  priority: TaskPriority;
  category: TaskCategory;
  subtasks?: Subtask[];
  progress?: number;
}

interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
}

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
  const [duration, setDuration] = useState<number>(initialValues?.duration || 60 * 60_000); // Default 1 hour
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate);
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialValues?.endDate || initialValues?.dueDate,
  );
  const [priority, setPriority] = useState<TaskPriority | ''>(initialValues?.priority || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialValues?.subtasks || []);
  const [progress, setProgress] = useState<number>(initialValues?.progress || 0);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleDurationChange = (durationMs: number) => {
    setDuration(durationMs);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
  };

  const handleSubtasksChange = (newSubtasks: Subtask[]) => {
    setSubtasks(newSubtasks);
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
      endDate,
      priority,
      category,
      subtasks,
      progress,
    });
  };

  const isValid = Boolean(
    title && startTime && endTime && duration && priority && !validationError,
  );

  return {
    values: {
      title,
      notes,
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
    },
    setters: {
      setTitle,
      setNotes,
      setEmoji,
      setStartTime,
      setEndTime,
      setDueDate,
      setEndDate,
      setPriority,
      setCategory,
      setSubtasks,
    },
    handlers: {
      handleDurationChange,
      handleStartTimeChange,
      handleEndTimeChange,
      handleSubtasksChange,
      handleSubmit,
    },
    validationError,
    isValid,
  };
}
