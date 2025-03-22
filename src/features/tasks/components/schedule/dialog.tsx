import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { Subtask, TaskCategory, TaskPriority } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
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
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { ClipboardList, Hash, ListPlus, Maximize2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import {
  clearDraftTask,
  getDefaultStartTime,
  getTaskCategoryAndPriority,
  resetDraftTask,
  setEditingTaskId,
  tasksStore,
  updateDraftTaskCategory,
  updateDraftTaskField,
  updateDraftTaskPriority,
  updateTask,
  updateTaskCategory,
  updateTaskPriority,
} from '../../store/tasks.store';
import { PriorityPicker } from './priority-picker';
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

const defaultValues: TaskFormValues = {
  title: '',
  notes: '',
  emoji: '',
  startTime: getDefaultStartTime(),
  dueTime: '',
  duration: 60 * 60 * 1000, // 1 hour in ms
  category: 'work',
  priority: 'medium',
  subtasks: [],
  progress: 0,
};

function TaskDialogContent({
  onSubmit,
  mode = 'create',
  className,
  onOpenChange,
  open,
  initialValues,
}: {
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  initialValues?: Partial<TaskFormValues>;
}) {
  // Local state for form values - always start with empty title in create mode
  const [values, setValues] = useState<TaskFormValues>(() => {
    // In create mode, start with guaranteed empty values for key fields
    if (mode === 'create') {
      return {
        ...defaultValues,
        ...initialValues,
      };
    }

    // For edit mode, use passed values
    return {
      ...defaultValues,
      ...initialValues,
      subtasks: initialValues?.subtasks || [],
    };
  });

  const updateValue = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const showActionButtons = values.title && values.title.length >= 3;
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);
  const hasDraftTask = useStore(tasksStore, (state) => Boolean(state.draftTask));

  // Get category and priority data from store if we're editing a task
  const categoryData = useStore(tasksStore, (state) => {
    // If editing an existing task
    if (editingTaskId) return getTaskCategoryAndPriority(editingTaskId);

    // If creating a new task with draft
    if (mode === 'create' && hasDraftTask) return getTaskCategoryAndPriority('draft');

    // Fallback for compatibility
    return {
      category: values.category || ('work' as TaskCategory),
      priority: values.priority || ('medium' as TaskPriority),
    };
  });

  // Show subtasks section automatically if there are existing subtasks
  const [showSubtasks, setShowSubtasks] = useState(
    Boolean(values.subtasks && values.subtasks.length > 0),
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Get the current date for task creation
  const today = format(new Date(), 'yyyy-MM-dd');

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (values.title && !values.emoji) {
      const suggestedEmoji = getSuggestedEmoji(values.title, values.category || 'work');
      updateValue('emoji', suggestedEmoji);
    }
  }, [values.title, values.category]);

  // Add effect to sync title changes
  useEffect(() => {
    if (mode === 'create' && hasDraftTask) {
      if (values.title) {
        updateDraftTaskField('title', values.title);
      }
      if (values.notes) {
        updateDraftTaskField('notes', values.notes);
      }
      if (values.emoji) {
        updateDraftTaskField('emoji', values.emoji);
      }
    }
  }, [mode, hasDraftTask, values.title, values.notes, values.emoji]);

  // Initialize draft task for new tasks and ensure cleanup
  useEffect(() => {
    // Create draft when opening the dialog
    if (mode === 'create' && open && !hasDraftTask) {
      console.log('Creating new draft task with reset values');
      resetDraftTask(); // Use resetDraftTask instead of createDraftTask to ensure clean slate
    } else if (mode === 'create' && open && hasDraftTask) {
      // If dialog is opening and there's already a draft, reset it to avoid stale data
      console.log('Resetting existing draft task');
      resetDraftTask();
    }

    // Clean up draft task when dialog is closed - simpler condition
    return () => {
      if (mode === 'create' && hasDraftTask) {
        console.log('Clearing draft task in cleanup effect');
        clearDraftTask();
      }
    };
  }, [mode, open, hasDraftTask]);

  // IMPORTANT: Add an effect to synchronize the form values with the draft task state
  // This ensures that the form always shows the current state of the draft task
  useEffect(() => {
    if (mode === 'create' && hasDraftTask && open) {
      const draftTask = tasksStore.state.draftTask;
      if (draftTask) {
        console.log('Syncing form values from draft task', { title: draftTask.title });
        // Only update the form if the values are different to avoid loops
        if (draftTask.title !== values.title) {
          updateValue('title', draftTask.title || '');
        }
        if (draftTask.notes !== values.notes) {
          updateValue('notes', draftTask.notes || '');
        }
        if (draftTask.emoji !== values.emoji) {
          updateValue('emoji', draftTask.emoji || '');
        }
        if (draftTask.subtasks !== values.subtasks) {
          updateValue('subtasks', draftTask.subtasks || []);
        }
      }
    }
  }, [mode, hasDraftTask, open, tasksStore.state.draftTask]);

  // Update form element handlers to sync with draft task
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    updateValue('title', newTitle);

    // Also update draft task if we're creating a new task
    if (mode === 'create' && hasDraftTask) {
      updateDraftTaskField('title', newTitle);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Auto-adjust height when title changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [values.title]);

  // Auto-adjust height when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      // Use a short timeout to ensure the dialog is fully rendered
      setTimeout(adjustTextareaHeight, 10);
    }
  }, [open]);

  // Position cursor at the end when dialog opens in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && textareaRef.current && values.title) {
      // Use requestAnimationFrame to ensure dialog is fully rendered
      const frameId = requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(values.title.length, values.title.length);
        }
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [open, mode]);

  // Initialize subtasks array if it doesn't exist
  useEffect(() => {
    if (!values.subtasks) {
      updateValue('subtasks', []);
    }
  }, []); // Run only once on mount

  // Ensure subtasks section is shown if there are subtasks
  useEffect(() => {
    if (values.subtasks && values.subtasks.length > 0 && !showSubtasks) {
      setShowSubtasks(true);
    }
  }, [values.subtasks, showSubtasks]);

  // Focus subtask input when adding a new subtask
  useEffect(() => {
    if (isAddingSubtask && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [isAddingSubtask]);

  // Maintain focus on the input when the subtask title is cleared
  useEffect(() => {
    if (isAddingSubtask && newSubtaskTitle === '' && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [newSubtaskTitle, isAddingSubtask]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!values.title) return;

    // For create mode, sync form values to draft task before submitting
    if (mode === 'create' && hasDraftTask) {
      // Sync all form values to draft task before creating
      updateDraftTaskField('title', values.title);
      if (values.notes) updateDraftTaskField('notes', values.notes);
      if (values.emoji) updateDraftTaskField('emoji', values.emoji);
      updateDraftTaskField('subtasks', values.subtasks || []);
      updateDraftTaskField('progress', values.progress || 0);

      // Let the onSubmit handler create the task - don't create it here
      // to prevent duplicate creation
      onSubmit(values);

      // Explicitly clear the draft task after submission
      console.log('Clearing draft task after submission');
      clearDraftTask();
    } else if (mode === 'edit' && editingTaskId) {
      // For edit mode, update the existing task with only the fields that match OptimalTask type
      updateTask(editingTaskId, {
        title: values.title,
        notes: values.notes,
        emoji: values.emoji,
        subtasks: values.subtasks || [],
        progress: values.progress || 0,
        category: values.category,
        priority: values.priority,
      });
      onSubmit(values);
    } else {
      onSubmit(values);
    }

    onOpenChange(false);
  };

  const handleClose = () => {
    // If creating a new task, clear the draft when closing without saving
    if (mode === 'create' && hasDraftTask) {
      console.log('Clearing draft task on manual close');
      clearDraftTask();
    }

    onOpenChange(false);
    setEditingTaskId(null);
  };

  const handleFullScreen = () => {
    if (values.title && values.title.length >= 3) {
      // Calculate progress for subtasks before submission
      if (values.subtasks && values.subtasks.length > 0) {
        const completedCount = values.subtasks.filter((subtask) => subtask.isCompleted).length;
        const progress = Math.round((completedCount / values.subtasks.length) * 100);
        updateValue('progress', progress);
      }

      let taskId: string | null = null;

      if (mode === 'edit' && editingTaskId) {
        // For edit mode, submit changes and use existing task ID
        onSubmit(values);
        taskId = editingTaskId;
      } else {
        // For create mode, submit values and let parent handle task creation
        // Don't call createTaskFromDraft directly to avoid duplicates
        onSubmit(values);

        // Explicitly clear the draft task in create mode
        if (mode === 'create' && hasDraftTask) {
          console.log('Clearing draft task after fullscreen submission');
          clearDraftTask();
        }

        // We don't have a taskId yet since onSubmit will create it
        // Navigate to the tasks list instead
        navigate({ to: '/tasks' });
        onOpenChange(false);
        setEditingTaskId(null);
        return;
      }

      if (taskId) {
        // Navigate to the task details page
        navigate({ to: `/tasks/${taskId}`, params: { taskId } });
      } else {
        // Fallback if task creation fails or taskId not found
        navigate({ to: '/tasks' });
      }

      // Close the dialog and clear the editing state
      onOpenChange(false);
      setEditingTaskId(null);
    }
  };

  const handleAddSubtask = () => {
    // Toggle visibility of subtasks section
    setShowSubtasks(!showSubtasks);

    // If we're showing the subtasks section now, immediately start adding a subtask
    if (!showSubtasks) {
      setIsAddingSubtask(true);
      // Focus will be handled by the useEffect that watches isAddingSubtask
    } else {
      // If we're hiding the subtasks section, make sure we're not in adding mode
      setIsAddingSubtask(false);
    }
  };

  const handleCreateSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: uuidv4(),
        title: newSubtaskTitle.trim(),
        isCompleted: false,
      };

      // Add to existing subtasks or create a new array
      const updatedSubtasks = [...(values.subtasks || []), newSubtask];

      // Update form context
      updateValue('subtasks', updatedSubtasks);

      // Calculate progress
      const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
      const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
      updateValue('progress', progress);

      // Clear input for next subtask but keep input field visible and focused
      setNewSubtaskTitle('');
      setTimeout(() => {
        subtaskInputRef.current?.focus();
      }, 0);
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubtask();
    } else if (e.key === 'Escape') {
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (subtaskId: string, isCompleted: boolean) => {
    const currentSubtasks = values.subtasks || [];
    const updatedSubtasks = currentSubtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
    );

    // Update form context
    updateValue('subtasks', updatedSubtasks);

    // Update progress
    if (updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
      const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
      updateValue('progress', progress);
    }
  };

  const handleEditSubtask = (subtaskId: string, title: string) => {
    const currentSubtasks = values.subtasks || [];
    const updatedSubtasks = currentSubtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, title } : subtask,
    );

    // Update form context
    updateValue('subtasks', updatedSubtasks);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const currentSubtasks = values.subtasks || [];
    const updatedSubtasks = currentSubtasks.filter((subtask) => subtask.id !== subtaskId);

    // Update form context
    updateValue('subtasks', updatedSubtasks);

    // Update progress
    if (updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
      const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
      updateValue('progress', progress);
    } else {
      updateValue('progress', 0);
    }
  };

  const startAddingSubtask = () => {
    setIsAddingSubtask(true);
    // Focus the input field after rendering
    setTimeout(() => {
      subtaskInputRef.current?.focus();
    }, 0);
  };

  return (
    <DialogContent
      overlayClassName="bg-black/10"
      onInteractOutside={handleClose}
      onEscapeKeyDown={handleClose}
      className={cn(
        'fixed left-1/2 top-[50%] z-50 grid max-h-[80vh] w-full max-w-full -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr_auto] rounded-lg border bg-card text-zinc-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] duration-75 dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:max-w-2xl',
        className,
      )}
    >
      {/* Dialog title outside the main content */}
      <DialogHeader className="absolute -left-0.5 -top-10 rounded-md bg-card p-2 text-sm">
        <DialogTitle className="text-xs">
          {mode === 'create' ? 'Add task' : 'Edit task'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'create' ? 'Add a new task to your timeline' : 'Edit an existing task'}
        </DialogDescription>
      </DialogHeader>

      {/* Fixed header with action buttons */}
      <div className="flex h-10 items-center justify-between px-4">
        {/* Emoji picker on the left */}
        <div className="-ml-2 flex items-center">
          <EmojiPicker
            emoji={values.emoji || ''}
            onEmojiSelect={(newEmoji) => updateValue('emoji', newEmoji)}
          />
        </div>

        {/* Action buttons on the right */}
        <div className="flex items-center">
          {showActionButtons && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddSubtask}
                className={cn(
                  'h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  (showSubtasks || isAddingSubtask) && 'bg-accent text-accent-foreground',
                )}
                aria-label="Add subtask"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              >
                <ListPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullScreen}
                className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Open full screen"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleFullScreen()}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Close dialog"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClose()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content area with native scrolling */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            <div className="relative flex items-baseline gap-2">
              <TaskCheckbox
                checked={values.progress === 100}
                onCheckedChange={(checked) => updateValue('progress', checked ? 100 : 0)}
                size="lg"
                className="mt-1"
                ariaLabel="Mark task as completed"
              />
              <div className="flex-1">
                <div className="relative w-full">
                  <div
                    className="invisible whitespace-pre-wrap break-words px-2 text-xl font-semibold"
                    aria-hidden="true"
                    style={{
                      minHeight: '1.5rem',
                      // Add a single space to ensure height is never zero
                      // Plus a line break for each new line in the content
                      // to ensure correct height calculation
                      paddingBottom: '1px',
                    }}
                  >
                    {(values.title || '') + (values.title?.endsWith('\n') ? ' ' : '\n')}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={values.title || ''}
                    onChange={handleTitleChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Task description"
                    className="absolute left-0 top-0 h-full min-h-[1.5rem] w-full resize-none border-none bg-transparent px-2 text-xl font-semibold text-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus={mode === 'create'}
                  />
                </div>
              </div>
            </div>

            {/* Subtasks section */}
            {showSubtasks && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
                  {values.subtasks && values.subtasks.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {values.subtasks.filter((s) => s.isCompleted).length}/{values.subtasks.length}{' '}
                      completed
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Show subtasks if they exist */}
                  {values.subtasks &&
                    values.subtasks.length > 0 &&
                    values.subtasks.map((subtask) => (
                      <div key={subtask.id} className="group flex items-baseline gap-2">
                        <TaskCheckbox
                          checked={subtask.isCompleted}
                          onCheckedChange={(checked) => handleToggleSubtask(subtask.id, checked)}
                          size="sm"
                          className="mt-0.5"
                          ariaLabel={`Toggle subtask: ${subtask.title}`}
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={subtask.title}
                            onChange={(e) => handleEditSubtask(subtask.id, e.target.value)}
                            className={`w-full bg-transparent text-sm font-medium focus:outline-none ${
                              subtask.isCompleted ? 'text-muted-foreground line-through' : ''
                            }`}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="invisible text-xs text-muted-foreground opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                          aria-label="Delete subtask"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                  {isAddingSubtask ? (
                    <div className="flex items-center gap-2">
                      <div className="ml-6 flex-1">
                        <input
                          ref={subtaskInputRef}
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={handleSubtaskKeyDown}
                          onBlur={() => {
                            // Create subtask if there's text, but don't hide the input field
                            if (newSubtaskTitle.trim()) {
                              handleCreateSubtask();
                            }
                          }}
                          placeholder="New subtask..."
                          className="w-full bg-transparent text-sm font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startAddingSubtask}
                      className="mt-1 flex w-full items-center justify-start gap-1 px-2 text-xs text-muted-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      Add subtask
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </form>

      {/* Fixed footer */}
      <div className="border-t border-border bg-card p-4">
        <TaskScheduler
          className="text-muted-foreground"
          taskId={editingTaskId || undefined}
          isDraft={mode === 'create' && hasDraftTask}
        />
        <div className="mt-2 flex items-center gap-1">
          {editingTaskId ? (
            // Editing an existing task
            <>
              <Select
                value={categoryData.category}
                onValueChange={(value: TaskCategory) => updateTaskCategory(editingTaskId, value)}
              >
                <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                  <div className="flex items-center">
                    {categoryData.category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                    {(categoryData.category === 'passion' || categoryData.category === 'play') && (
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    )}
                    <SelectValue>
                      {categoryData.category === 'work'
                        ? 'Work'
                        : categoryData.category === 'passion'
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

              <PriorityPicker
                value={categoryData.priority}
                onValueChange={(priority) => updateTaskPriority(editingTaskId, priority)}
              />
            </>
          ) : (
            // Creating a new task
            <>
              {hasDraftTask ? (
                // Use the draft task data
                <>
                  <Select
                    value={categoryData.category}
                    onValueChange={(value: TaskCategory) => updateDraftTaskCategory(value)}
                  >
                    <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                      <div className="flex items-center">
                        {categoryData.category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                        {(categoryData.category === 'passion' ||
                          categoryData.category === 'play') && (
                          <ClipboardList className="mr-1 h-3.5 w-3.5" />
                        )}
                        <SelectValue>
                          {categoryData.category === 'work'
                            ? 'Work'
                            : categoryData.category === 'passion'
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

                  <PriorityPicker
                    value={categoryData.priority}
                    onValueChange={(priority) => updateDraftTaskPriority(priority)}
                  />
                </>
              ) : (
                // Fall back to form context for compatibility
                <>
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

                  <PriorityPicker
                    value={values.priority || 'medium'}
                    onValueChange={(priority) => updateValue('priority', priority)}
                  />
                </>
              )}
            </>
          )}
        </div>
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
      <TaskDialogContent
        onSubmit={onSubmit}
        mode={mode}
        className={className}
        onOpenChange={onOpenChange}
        open={open}
        initialValues={initialValues}
      />
    </Dialog>
  );
}
