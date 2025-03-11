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
import { Textarea } from '@/shared/components/ui/textarea';
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { ClipboardList, Hash, ListPlus, Maximize2, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { TaskFormProvider, useTaskForm } from '../../context/task-form-context';
import { useTaskFormSubmission } from '../../hooks/use-task-form-submission';
import {
  getTaskCategoryAndPriority,
  setEditingTaskId,
  tasksStore,
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

function TaskDialogContent({
  onSubmit,
  mode = 'create',
  className,
  onOpenChange,
  open,
}: {
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { values, updateValue, isValid } = useTaskForm();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const showActionButtons = values.title && values.title.length >= 3;
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);

  // Get category and priority data from store if we're editing a task
  const categoryData = useStore(tasksStore, (state) => {
    if (!editingTaskId)
      return { category: 'work' as TaskCategory, priority: 'medium' as TaskPriority };
    return getTaskCategoryAndPriority(editingTaskId);
  });

  // Show subtasks section automatically if there are existing subtasks
  const [showSubtasks, setShowSubtasks] = useState(
    Boolean(values.subtasks && values.subtasks.length > 0),
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Get the current date for task creation
  const today = format(new Date(), 'yyyy-MM-dd');
  const { createNewTask } = useTaskFormSubmission(today);

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
  }, [open, mode, values.title]);

  // Initialize subtasks array if it doesn't exist
  useEffect(() => {
    // Check if subtasks is undefined or null and initialize it
    if (!values.subtasks) {
      updateValue('subtasks', []);
    } else {
      // Force an update to ensure the subtasks are properly in sync
      updateValue('subtasks', [...values.subtasks]);
    }
  }, []);

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
    e?.preventDefault();
    if (!values.title) return;

    if (isValid) {
      // Calculate progress for subtasks before submission
      if (values.subtasks && values.subtasks.length > 0) {
        const completedCount = values.subtasks.filter((subtask) => subtask.isCompleted).length;
        const progress = Math.round((completedCount / values.subtasks.length) * 100);
        updateValue('progress', progress);
      }

      onSubmit(values);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (values.title && mode === 'create') {
      // Calculate progress for subtasks before submission
      if (values.subtasks && values.subtasks.length > 0) {
        const completedCount = values.subtasks.filter((subtask) => subtask.isCompleted).length;
        const progress = Math.round((completedCount / values.subtasks.length) * 100);
        updateValue('progress', progress);
      }

      onSubmit(values);
    } else if (values.title && mode === 'edit') {
      // For edit mode, make sure to save changes even when closing
      onSubmit(values);
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
        // For create mode, create the task directly
        taskId = createNewTask(values, values.category || 'work');
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
      updateValue('subtasks', updatedSubtasks);

      // Clear input for next subtask but keep input field visible and focused
      setNewSubtaskTitle('');

      // Keep the adding mode active so user can add multiple subtasks in succession
      // Focus will be maintained by the useEffect that watches for changes to newSubtaskTitle
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
    const updatedSubtasks = values.subtasks?.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
    );

    updateValue('subtasks', updatedSubtasks);

    // Update progress after toggling subtask
    if (updatedSubtasks && updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
      const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
      updateValue('progress', progress);
    }
  };

  const handleEditSubtask = (subtaskId: string, title: string) => {
    const updatedSubtasks = values.subtasks?.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, title } : subtask,
    );

    updateValue('subtasks', updatedSubtasks);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = values.subtasks?.filter((subtask) => subtask.id !== subtaskId);
    updateValue('subtasks', updatedSubtasks);
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
                <Textarea
                  ref={textareaRef}
                  value={values.title || ''}
                  onChange={(e) => updateValue('title', e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Task description"
                  className="min-h-[1.5rem] resize-none border-none bg-transparent px-2 text-xl font-semibold text-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus={mode === 'create'}
                />
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
        <TaskScheduler className="text-muted-foreground" taskId={editingTaskId || undefined} />
        <div className="mt-2 flex items-center gap-1">
          {editingTaskId ? (
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
  // We still need TaskFormProvider for new tasks because we haven't fully migrated
  // everything to store yet
  const enhancedInitialValues = useMemo(() => {
    if (!initialValues) return initialValues;

    return {
      ...initialValues,
      // Ensure subtasks array exists and has the correct format
      subtasks: initialValues.subtasks || [],
    };
  }, [initialValues]);

  return (
    <Dialog open={open}>
      <TaskFormProvider initialValues={enhancedInitialValues}>
        <TaskDialogContent
          onSubmit={onSubmit}
          mode={mode}
          className={className}
          onOpenChange={onOpenChange}
          open={open}
        />
      </TaskFormProvider>
    </Dialog>
  );
}
