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
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { ChevronDown, ChevronRight, ListPlus, Maximize2, Pin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { estimateTaskDuration } from '../../../../lib/groq-service';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { useSubtasksCollapse } from '../../hooks/use-subtasks-collapse';
import {
  loadTaskForEditing,
  resetForm,
  submitForm,
  TaskFormState,
  taskFormStore,
  updateField,
  updateFields,
} from '../../stores/task-form.store';
import { setEditingTaskId, setFocused, tasksStore, updateTask } from '../../stores/tasks.store';
import { SubtaskList } from '../details/subtasks';
import { EmojiPicker } from './emoji-picker';
import { PriorityPicker } from './priority-picker';
import { SliderTimePicker } from './slider-time-picker';
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
  completed?: boolean;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onRequestPriorityPrediction?: (
    taskData: { taskId?: string; title: string },
    callback: (priority: TaskPriority) => void,
  ) => void;
}

function TaskDialogContent({
  onSubmit,
  mode = 'create',
  className,
  onOpenChange,
  open,
  initialValues,
  onRequestPriorityPrediction,
}: {
  onSubmit: (values: TaskFormValues) => void;
  mode?: 'create' | 'edit';
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  initialValues?: Partial<TaskFormValues>;
  onRequestPriorityPrediction?: (
    taskData: { taskId?: string; title: string },
    callback: (priority: TaskPriority) => void,
  ) => void;
}) {
  // Use the store for all form values
  const title = useStore(taskFormStore, (state) => state.title);
  const notes = useStore(taskFormStore, (state) => state.notes);
  const emoji = useStore(taskFormStore, (state) => state.emoji);
  const category = useStore(taskFormStore, (state) => state.category);
  const priority = useStore(taskFormStore, (state) => state.priority);
  const subtasks = useStore(taskFormStore, (state) => state.subtasks);
  const progress = useStore(taskFormStore, (state) => state.progress);
  const duration = useStore(taskFormStore, (state) => state.duration);
  const completed = useStore(taskFormStore, (state) => state.completed);

  // Track original title for edit mode
  const [originalTitle, setOriginalTitle] = useState<string>('');
  const [titleHasChanged, setTitleHasChanged] = useState(false);

  // Tracking flag for prediction requests to avoid duplicates
  const [predictionRequested, setPredictionRequested] = useState(false);

  // Force re-render for emoji changes
  const [emojiKey, setEmojiKey] = useState(0);

  // Effect to update emoji key when emoji changes
  useEffect(() => {
    setEmojiKey((prev) => prev + 1);
  }, [emoji]);

  // Effect to track title changes
  useEffect(() => {
    if (
      mode === 'edit' &&
      title !== originalTitle &&
      Math.abs(title.length - originalTitle.length) >= 5
    ) {
      setTitleHasChanged(true);
      // Reset prediction flag when title changes significantly
      setPredictionRequested(false);
    }
  }, [title, originalTitle, mode]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const showActionButtons = title && title.length > 0;
  const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);
  const isFocused = useStore(tasksStore, (state) => state.focusedTaskId === editingTaskId);

  // Collapsible state - closed by default
  const { isSubtasksOpen, setIsSubtasksOpen } = useSubtasksCollapse();

  // Show subtasks section automatically if there are existing subtasks
  const [showSubtasks, setShowSubtasks] = useState(Boolean(subtasks && subtasks.length > 0));

  // Loading state for AI task splitting
  const [isSplittingTask, setIsSplittingTask] = useState(false);

  // AI estimation state
  const [isDurationEstimating, setIsDurationEstimating] = useState(false);
  const [lastEstimatedTitle, setLastEstimatedTitle] = useState('');

  // AI priority prediction state
  const [isPriorityPredicting, setIsPriorityPredicting] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      // Initialize form for create or edit mode
      if (mode === 'create') {
        // Reset form to default values
        resetForm();
        setShowSubtasks(false);
        setTitleHasChanged(false);
        setOriginalTitle('');
        setPredictionRequested(false);

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

          // Set the original title to track changes
          setOriginalTitle(taskToEdit.title || '');
          setTitleHasChanged(false);
          setPredictionRequested(false);
        }
      }
    }
  }, [open, mode, editingTaskId, initialValues]);

  // Effect to reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Adding a log to confirm this runs, and what the state of taskFormStore.taskId is before reset
      const currentFormTaskId = taskFormStore.state.taskId;
      console.log(
        `[TaskDialogContent] Dialog closing. Current taskFormStore.taskId: ${currentFormTaskId}. Calling resetForm().`,
      );
      resetForm();
    }
  }, [open]);

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
    if (open && mode === 'edit' && textareaRef.current) {
      // Use requestAnimationFrame to ensure dialog is fully rendered
      const frameId = requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length,
          );
        }
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [open, mode]);

  // Ensure subtasks section is shown if there are subtasks
  useEffect(() => {
    if (subtasks && subtasks.length > 0 && !showSubtasks) {
      setShowSubtasks(true);
      // Don't automatically open the collapsible when subtasks exist
    }
  }, [mode, subtasks, showSubtasks]);

  // Helper function to check if we should request priority prediction
  const shouldRequestPriorityPrediction = () => {
    return (
      title &&
      title.trim().length > 3 &&
      onRequestPriorityPrediction &&
      !predictionRequested && // Only request if we haven't already
      (mode === 'create' || (mode === 'edit' && titleHasChanged))
    );
  };

  // Helper to emit priority prediction request to parent with callback
  const requestPriorityPrediction = () => {
    if (!shouldRequestPriorityPrediction() || !onRequestPriorityPrediction) {
      return;
    }

    // Mark prediction as requested to prevent duplicates
    setPredictionRequested(true);
    setIsPriorityPredicting(true);

    // Call parent with a callback to handle prediction completion
    onRequestPriorityPrediction(
      {
        taskId: mode === 'edit' && editingTaskId ? editingTaskId : undefined,
        title,
      },
      (predictedPriority) => {
        // Update local state with the predicted priority
        updateField('priority', predictedPriority);

        // Reset the predicting state when complete
        setIsPriorityPredicting(false);
      },
    );
  };

  // Create a unified batch submission function for clean submission
  const submitFormBatch = () => {
    if (!title) return;

    // Trigger priority prediction if needed
    if (shouldRequestPriorityPrediction()) {
      requestPriorityPrediction();
    }

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
        completed,
        // Do NOT include duration in edit mode unless explicitly changed
      };

      // Update the task with all changes at once
      updateTask(editingTaskId, updateObj);
    }
  };

  // Update handleSubmit to remove direct prediction request
  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    // Prediction request is handled within submitFormBatch

    if (title && title.length > 0) {
      // Submit the form immediately
      submitFormBatch();
      onOpenChange(false);
      setEditingTaskId(null);
    }
  };

  // Handle when title input loses focus
  const handleTitleBlur = () => {
    // Request priority prediction on blur if needed
    if (shouldRequestPriorityPrediction()) {
      requestPriorityPrediction();
    }
  };

  // Update handleClose to remove direct prediction request
  const handleClose = async () => {
    // Prediction request is handled within submitFormBatch

    // Only submit if we have a title and either this is a "create" action or the form is dirty
    // This prevents accidental changes to the duration when just opening and closing the dialog
    if (title && title.length > 0 && (mode === 'create' ? taskFormStore.state.isDirty : true)) {
      // Submit changes before closing
      submitFormBatch();
    }

    // Always close the dialog and reset editing state
    onOpenChange(false);
    setEditingTaskId(null);
  };

  // Update handleFullScreen to remove direct prediction request
  const handleFullScreen = () => {
    // Prediction request is handled within submitFormBatch

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

  // Create a dedicated function for AI estimation that can be passed to the DurationPicker
  const requestAiEstimate = async () => {
    if (!title || title.trim().length < 5) return;

    setIsDurationEstimating(true);

    try {
      const estimatedDuration = await estimateTaskDuration(title);
      updateField('duration', estimatedDuration);
    } catch (error) {
      console.error('Failed to estimate duration:', error);
    } finally {
      setIsDurationEstimating(false);
    }
  };

  // Update key event handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    updateField('title', newTitle);

    // In edit mode, check if title has changed from original
    if (
      mode === 'edit' &&
      newTitle !== originalTitle &&
      Math.abs(newTitle.length - originalTitle.length) >= 5
    ) {
      setTitleHasChanged(true);
      // Reset prediction flag when title changes significantly
      setPredictionRequested(false);
    }
  };

  // Handle priority change
  const handlePriorityChange = (newPriority: TaskPriority) => {
    updateField('priority', newPriority);
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
            key={`emoji-picker-${emojiKey}`}
            emoji={emoji || ''}
            onEmojiSelect={(newEmoji) => updateField('emoji', newEmoji)}
          />
        </div>

        {/* Action buttons on the right */}
        <div className="flex items-center">
          {showActionButtons && (
            <>
              {!isFocused && (
                <Button
                  title="Work now"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // First submit any changes
                    submitFormBatch();

                    // Get the task ID - for new tasks, it will be created during submitFormBatch
                    const taskId =
                      editingTaskId ||
                      tasksStore.state.tasks[tasksStore.state.tasks.length - 1]?.id;

                    // Then focus the task - this will handle all the time updates
                    if (taskId) {
                      setFocused(taskId, true, { preserveTimeAndDate: false });
                    }

                    // Finally close the dialog and reset editing state
                    onOpenChange(false);
                    setEditingTaskId(null);
                  }}
                  className="mr-2 h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label="Focus now"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitFormBatch();

                      // Get the task ID - for new tasks, it will be created during submitFormBatch
                      const taskId =
                        editingTaskId ||
                        tasksStore.state.tasks[tasksStore.state.tasks.length - 1]?.id;

                      // Then focus the task - this will handle all the time updates
                      if (taskId) {
                        setFocused(taskId, true, { preserveTimeAndDate: false });
                      }

                      onOpenChange(false);
                      setEditingTaskId(null);
                    }
                  }}
                >
                  <Pin className="h-4 w-4" />
                </Button>
              )}
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
                checked={completed}
                onCheckedChange={(checked) => {
                  updateField('completed', checked);
                  updateField('progress', checked ? 100 : 0);
                }}
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
                    onBlur={handleTitleBlur}
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
                        {
                          subtasks
                            .filter((s) => s.title.trim().length > 0)
                            .filter((s) => s.isCompleted).length
                        }
                        /{subtasks.filter((s) => s.title.trim().length > 0).length} completed
                      </span>
                    )}
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden px-2 pt-3">
                    <SubtaskList
                      subtasks={subtasks || []}
                      onSubtasksChange={handleSubtasksChange}
                      taskTitle={title || ''}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </ScrollArea>
      </form>

      {/* Fixed footer */}
      <div className="flex flex-col gap-2 border-t border-border bg-card p-2">
        <div className="mb-2 flex w-full items-center justify-between">
          <TaskScheduler
            className="text-muted-foreground"
            taskId={editingTaskId || undefined}
            isEstimating={isDurationEstimating}
            onRequestAiEstimate={requestAiEstimate}
            taskTitle={title}
          />
          <div className="flex items-center gap-1">
            {/* <Select
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
            </Select> */}

            <PriorityPicker
              value={priority}
              onValueChange={handlePriorityChange}
              isPredicting={isPriorityPredicting}
              taskTitle={title}
            />
          </div>
        </div>

        <SliderTimePicker className="w-full" />
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
  onRequestPriorityPrediction,
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
        onRequestPriorityPrediction={onRequestPriorityPrediction}
      />
    </Dialog>
  );
}
