import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { OptimalTask, Subtask, TaskCategory, TaskPriority } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
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
import { ChevronDown, ChevronRight, Hash, ListPlus, Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import {
  loadTaskForEditing,
  resetForm,
  submitForm,
  TaskFormState,
  taskFormStore,
  updateField,
  updateFields,
} from '../../store/task-form.store';
import { setEditingTaskId, tasksStore, updateTask } from '../../store/tasks.store';
import { SubtaskList } from '../details/subtasks';
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
  initialValues,
}: {
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  initialValues?: Partial<TaskFormValues>;
}) {
  // Use the store for all form values
  const title = useStore(taskFormStore, (state) => state.title);
  const notes = useStore(taskFormStore, (state) => state.notes);
  const emoji = useStore(taskFormStore, (state) => state.emoji);
  const category = useStore(taskFormStore, (state) => state.category);
  const priority = useStore(taskFormStore, (state) => state.priority);
  const subtasks = useStore(taskFormStore, (state) => state.subtasks);
  const progress = useStore(taskFormStore, (state) => state.progress);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const showActionButtons = title && title.length > 0;
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);

  console.log('subtasks: ', subtasks, mode);

  // Collapsible state - closed by default
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);

  // Show subtasks section automatically if there are existing subtasks
  const [showSubtasks, setShowSubtasks] = useState(Boolean(subtasks && subtasks.length > 0));

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      // Initialize form for create or edit mode
      if (mode === 'create') {
        // Reset form to default values
        resetForm();

        setShowSubtasks(false);

        // Apply any initial values passed to the component
        if (initialValues) {
          updateFields(initialValues as Partial<TaskFormState>);
        }
      } else if (mode === 'edit' && editingTaskId) {
        // Set form mode
        updateField('mode', 'edit');

        // Find the task to edit
        const taskToEdit = tasksStore.state.tasks.find((t) => t.id === editingTaskId);
        if (taskToEdit) {
          // Load task data into form
          loadTaskForEditing(taskToEdit);
        }
      }
    }
  }, [open, mode, editingTaskId, initialValues]);

  // Auto-suggest emoji when title or category changes
  useEffect(() => {
    if (title && !emoji) {
      const suggestedEmoji = getSuggestedEmoji(title, category || 'work');
      updateField('emoji', suggestedEmoji);
    }
  }, [title, category, emoji]);

  // Auto-adjust height when title changes
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

  // Auto-adjust height when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      // Use a short timeout to ensure the dialog is fully rendered
      setTimeout(adjustTextareaHeight, 10);
    }
  }, [open]);

  // Position cursor at the end when dialog opens in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && textareaRef.current && title) {
      // Use requestAnimationFrame to ensure dialog is fully rendered
      const frameId = requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(title.length, title.length);
        }
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [open, mode, title]);

  // Ensure subtasks section is shown if there are subtasks
  useEffect(() => {
    if (subtasks && subtasks.length > 0 && !showSubtasks) {
      setShowSubtasks(true);
      // Don't automatically open the collapsible when subtasks exist
    }
  }, [mode, subtasks, showSubtasks]);

  // Create a unified batch submission function for clean submission
  const submitFormBatch = () => {
    if (!title) return;

    console.log('Submitting form as batch on exit');

    // Get all form values and submit them
    const formValues = submitForm();
    onSubmit(formValues as TaskFormValues);

    // For edit mode, update the task in the store
    if (mode === 'edit' && editingTaskId) {
      // Convert form values to OptimalTask format
      const updateObj: Partial<OptimalTask> = {
        title,
        notes,
        emoji,
        subtasks,
        progress,
        category,
        priority,
      };

      // Update the task with all changes at once
      updateTask(editingTaskId, updateObj);
    }
  };

  // Update key event handlers to use the batch submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (title && title.length > 0) {
        submitFormBatch();
        onOpenChange(false);
        setEditingTaskId(null);
      }
    }
  };

  const handleAddSubtask = () => {
    // Always show the subtasks section when clicked
    setShowSubtasks(true);
    // Also open the collapsible when the button is clicked
    setIsSubtasksOpen(true);
  };

  // Update subtasks in batch form submission
  const handleSubtasksChange = (newSubtasks: Subtask[]) => {
    updateField('subtasks', newSubtasks);

    // If subtasks are added for the first time, open the collapsible
    if (newSubtasks.length > 0 && (!subtasks || subtasks.length === 0)) {
      setIsSubtasksOpen(true);
    }
  };

  // Update title field in the form store
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateField('title', e.target.value);
  };

  // Replace handleSubmit with the batch submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (title && title.length > 0) {
      submitFormBatch();
      onOpenChange(false);
      setEditingTaskId(null);
    }
  };

  // Update handleClose to submit changes if title is valid
  const handleClose = () => {
    if (title && title.length > 0) {
      // Submit changes before closing
      submitFormBatch();
    }

    onOpenChange(false);
    setEditingTaskId(null);
  };

  // Update handleFullScreen to use batch submission
  const handleFullScreen = () => {
    if (title && title.length > 0) {
      // Submit the form in batch
      submitFormBatch();

      let taskId: string | null = null;

      if (mode === 'edit' && editingTaskId) {
        taskId = editingTaskId;
      }

      // Navigate based on available task ID
      if (taskId) {
        navigate({ to: `/tasks/${taskId}`, params: { taskId } });
      } else {
        navigate({ to: '/tasks' });
      }

      // Close the dialog and clear the editing state
      onOpenChange(false);
      setEditingTaskId(null);
    }
  };

  return (
    <DialogContent
      overlayClassName="bg-black/10"
      onInteractOutside={handleClose}
      onEscapeKeyDown={handleClose}
      className={cn(
        'fixed left-1/2 top-[50%] z-50 grid max-h-[80vh] w-full max-w-full -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr_auto] rounded-lg border bg-card p-2 px-1 text-zinc-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] duration-75 dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:max-w-2xl',
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
      <div className="flex h-10 items-center justify-between px-4 pr-1">
        {/* Emoji picker on the left */}
        <div className="-ml-2 flex items-center">
          <EmojiPicker
            emoji={emoji || ''}
            onEmojiSelect={(newEmoji) => updateField('emoji', newEmoji)}
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
                  showSubtasks && isSubtasksOpen && 'bg-accent text-accent-foreground',
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
                checked={progress === 100}
                onCheckedChange={(checked) => updateField('progress', checked ? 100 : 0)}
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
                    {(title || '') + (title?.endsWith('\n') ? ' ' : '\n')}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={title || ''}
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

            {/* Subtasks section as a collapsible */}
            {showSubtasks && (
              <div className="mb-1 mt-2">
                <Collapsible
                  open={isSubtasksOpen}
                  onOpenChange={setIsSubtasksOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-muted-foreground hover:bg-sidebar/30 hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-4 w-4 items-center justify-center">
                        {isSubtasksOpen ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </div>
                      <h3 className="text-sm font-medium">Subtasks</h3>
                    </div>
                    {subtasks && subtasks.length > 0 && (
                      <span className="text-xs">
                        {subtasks.filter((s) => s.isCompleted).length}/{subtasks.length} completed
                      </span>
                    )}
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden px-2 pt-3">
                    <SubtaskList
                      subtasks={subtasks || []}
                      onSubtasksChange={handleSubtasksChange}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </ScrollArea>
      </form>

      {/* Fixed footer */}
      <div className="flex items-baseline border-t border-border bg-card p-2">
        <TaskScheduler className="text-muted-foreground" taskId={editingTaskId || undefined} />
        <div className="mt-2 flex flex-1 items-center justify-between gap-1">
          <Select
            value={category}
            onValueChange={(value: TaskCategory) => updateField('category', value)}
          >
            <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
              <div className="flex items-center">
                {category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                {(category === 'passion' || category === 'play') && (
                  <Hash className="mr-1 h-3.5 w-3.5" />
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
                  <Hash className="mr-1 h-3.5 w-3.5" />
                  Passion
                </div>
              </SelectItem>
              <SelectItem value="play">
                <div className="flex items-center">
                  <Hash className="mr-1 h-3.5 w-3.5" />
                  Play
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <PriorityPicker
            className="self-end"
            value={priority}
            onValueChange={(priority) => updateField('priority', priority)}
          />
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
