import { findEmojiForTitle } from '@/lib/emoji-matcher';
import { Store } from '@tanstack/react-store';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  OptimalTask,
  RepetitionOption,
  RepetitionType,
  Subtask,
  TaskCategory,
  TaskPriority,
} from '../types/task.types';
import { getDefaultStartTime, updateTask, updateTaskDuration } from './tasks.store';

// Define the TaskForm state interface
export interface TaskFormState {
  // Basic task info
  title: string;
  notes: string;
  emoji: string;
  isEmojiSetByAi: boolean;

  // Task categorization
  category: TaskCategory;
  priority: TaskPriority;

  // Scheduling
  startDate: Date;
  startTime: string;
  duration: number;
  dueDate?: Date;
  dueTime: string;
  repetition: RepetitionType;
  repeatInterval: number;
  isTimeFixed: boolean;

  // Subtasks
  subtasks: Subtask[];
  progress: number;
  completed: boolean;

  // Form state
  mode: 'create' | 'edit';
  taskId: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
  isDurationManuallySet: boolean;
  isPriorityManuallySet: boolean;
}

// Get the current time for default values
const now = new Date();

// Default to current hour, rounded to the nearest 5 minutes
// Get the current date
const defaultStartTime = now;
// Round minutes to the nearest 5
const minutes = Math.round(now.getMinutes() / 5) * 5;
// Set the rounded minutes
defaultStartTime.setMinutes(minutes % 60);
// If we rounded up to 60, increment the hour
if (minutes === 60) {
  defaultStartTime.setHours(defaultStartTime.getHours() + 1);
  defaultStartTime.setMinutes(0);
}
// Clear seconds and milliseconds
defaultStartTime.setSeconds(0);
defaultStartTime.setMilliseconds(0);

// Get the default time as string
const defaultTimeString = `${defaultStartTime.getHours().toString().padStart(2, '0')}:${defaultStartTime
  .getMinutes()
  .toString()
  .padStart(2, '0')}`;

// Initialize the default state
const initialState: TaskFormState = {
  // Basic task info
  title: '',
  notes: '',
  emoji: '',
  isEmojiSetByAi: false,

  // Task categorization
  category: 'work',
  priority: 'medium',

  // Scheduling
  startDate: defaultStartTime,
  startTime: defaultTimeString,
  // Change default duration to 45 minutes (from 1 hour)
  duration: 45 * 60 * 1000, // 45 minutes in ms
  dueDate: undefined,
  dueTime: '',
  repetition: 'once',
  repeatInterval: 1,
  isTimeFixed: false,

  // Subtasks
  subtasks: [],
  progress: 0,
  completed: false,

  // Form state
  mode: 'create',
  taskId: null,
  isSubmitting: false,
  isDirty: false,
  isDurationManuallySet: false,
  isPriorityManuallySet: false,
};

// Create the store
export const taskFormStore = new Store<TaskFormState>(initialState);

// Action to initialize startDate and startTime from URL for new/pristine forms
export const initializeStartDateForCreateForm = (dateStringFromUrl?: string) => {
  taskFormStore.setState((state) => {
    // Only apply if in 'create' mode, no taskId yet, and form is not dirty (isDirty might not be needed if we check mode and taskId)
    if (state.mode === 'create' && !state.taskId) {
      let newStartDate: Date;
      if (dateStringFromUrl) {
        const parsed = parseISO(dateStringFromUrl); // Expects YYYY-MM-DD
        if (!isNaN(parsed.getTime())) {
          newStartDate = parsed;
        } else {
          console.warn('Invalid date string from URL, using current date:', dateStringFromUrl);
          newStartDate = new Date(); // Fallback for invalid string
        }
      } else {
        newStartDate = new Date(); // Fallback if no string provided
      }

      // Create a new Date object for manipulation to avoid mutating the original newStartDate
      const dateToRound = new Date(newStartDate);

      // Round minutes to the nearest 5 for startTime consistency
      const minutes = Math.round(dateToRound.getMinutes() / 5) * 5;
      dateToRound.setMinutes(minutes % 60);
      if (minutes === 60) {
        // Handle rounding up to the next hour
        dateToRound.setHours(dateToRound.getHours() + 1);
        dateToRound.setMinutes(0);
      }
      dateToRound.setSeconds(0);
      dateToRound.setMilliseconds(0);

      // Check if the determined startDate is actually different from the current one
      // To avoid unnecessary updates and potential loops if called repeatedly
      if (state.startDate.getTime() === dateToRound.getTime()) {
        return state; // No change needed
      }

      return {
        ...state,
        startDate: dateToRound,
        startTime: format(dateToRound, 'HH:mm'),
        isDirty: false, // Setting from URL date should not mark form as dirty initially
      };
    }
    return state; // No conditions met, return current state
  });
};

// Update a single field with setting the dirty flag
export const updateField = <K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) => {
  taskFormStore.setState((state) => {
    // Start with the basic update
    const newState: Partial<TaskFormState> = {
      [field]: value,
      isDirty: true,
    };

    // If updating emoji directly, mark it as not AI-set
    if (field === 'emoji') {
      newState.isEmojiSetByAi = false;
    }

    // If updating title in create mode, check for emoji suggestion ONLY if no emoji is set by AI
    if (
      field === 'title' &&
      typeof value === 'string' &&
      state.mode === 'create' &&
      !state.isEmojiSetByAi
    ) {
      const emoji = findEmojiForTitle(value);

      // Debug log remains helpful
      console.log('Title update triggered emoji suggestion:', {
        title: value,
        suggestedEmoji: emoji,
        currentEmoji: state.emoji,
        isEmojiSetByAi: state.isEmojiSetByAi,
      });

      // Add emoji to the update *if* it's valid and different and not set by AI
      if (emoji && emoji !== state.emoji) {
        console.log('Adding suggested emoji to update:', emoji);
        newState.emoji = emoji;
      }
    }

    // Return the combined new state properties
    return {
      ...state,
      ...newState,
    };
  });
};

// Update multiple fields at once
export const updateFields = (fields: Partial<TaskFormState>) => {
  taskFormStore.setState((state) => ({
    ...state,
    ...fields,
    isDirty: true,
  }));
};

// Load values for editing an existing task
export const loadTaskForEditing = (taskData: OptimalTask) => {
  const startTimeString = taskData.time?.split('—')[0] || getDefaultStartTime();

  taskFormStore.setState(() => ({
    title: taskData.title || '',
    notes: taskData.notes || '',
    emoji: taskData.emoji || '',
    isEmojiSetByAi: false, // Reset AI flag when loading existing task
    category: taskData.category || 'work',
    priority: taskData.priority || 'medium',
    startDate: taskData.startTime || new Date(),
    startTime: startTimeString,
    // Change fallback duration to 45 minutes (from 1 hour)
    duration: taskData.duration || 45 * 60 * 1000, // 45 minutes in ms
    dueDate: taskData.dueDate,
    dueTime: taskData.dueTime || '',
    repetition: taskData.repetition?.type || 'once',
    repeatInterval: taskData.repetition?.repeatInterval || 1,
    isTimeFixed: taskData.isTimeFixed || false,
    subtasks: taskData.subtasks || [],
    progress: taskData.progress || 0,
    completed: taskData.completed || false,
    mode: 'edit',
    taskId: taskData.id,
    isSubmitting: false,
    isDirty: false,
    isDurationManuallySet: false, // Reset on load
    isPriorityManuallySet: false, // Reset on load
  }));
};

// Reset the form to the default state
export const resetForm = () => {
  // Get fresh defaults for time as initialState might be stale if app runs long
  const now = new Date();
  const newDefaultStartTime = new Date(now);
  const minutes = Math.round(newDefaultStartTime.getMinutes() / 5) * 5;
  newDefaultStartTime.setMinutes(minutes % 60);
  if (minutes === 60) {
    newDefaultStartTime.setHours(newDefaultStartTime.getHours() + 1);
    newDefaultStartTime.setMinutes(0);
  }
  newDefaultStartTime.setSeconds(0);
  newDefaultStartTime.setMilliseconds(0);
  const newDefaultTimeString = format(newDefaultStartTime, 'HH:mm');

  taskFormStore.setState(() => ({
    ...initialState, // Spread the original initial state
    // Override date/time with fresh defaults
    startDate: newDefaultStartTime,
    startTime: newDefaultTimeString,
    isDurationManuallySet: false, // Ensure reset
    isPriorityManuallySet: false, // Ensure reset
    // duration: previousDuration, // If you wanted to keep last used duration
  }));
};

// Submit the form values, directly returning the current state
export const submitForm = () => {
  // Set isSubmitting true - this could be used for UI loading states
  taskFormStore.setState((state) => ({
    ...state,
    isSubmitting: true,
  }));

  // Get the current form values
  const formValues = { ...taskFormStore.state };

  // Reset isSubmitting and isDirty, but keep the form values
  // (allows reviewing the submitted values if needed)
  taskFormStore.setState((state) => ({
    ...state,
    isSubmitting: false,
    isDirty: false,
  }));

  return formValues;
};

export const updateStartDateTime = (date: Date, time: string) => {
  taskFormStore.setState((state) => ({
    ...state,
    startDate: date,
    startTime: time,
    isDirty: true,
  }));
};

export const updateDueDateTime = (date: Date | undefined, time: string) => {
  taskFormStore.setState((state) => ({
    ...state,
    dueDate: date,
    dueTime: time,
    isDirty: true,
  }));
};

export const updateRepetition = (repetition: RepetitionType) => {
  taskFormStore.setState((state) => ({
    ...state,
    repetition,
    isDirty: true,
  }));
};

export const updateRepeatInterval = (repeatInterval: number) => {
  taskFormStore.setState((state) => ({
    ...state,
    repeatInterval,
    isDirty: true,
  }));
};

export const updateDuration = (durationMs: number) => {
  const { mode, taskId } = taskFormStore.state;

  // Update form store
  taskFormStore.setState((state) => ({
    ...state,
    duration: durationMs,
    isDirty: true,
  }));

  // If in edit mode, update the task store
  if (mode === 'edit' && taskId) {
    updateTaskDuration(taskId, durationMs);
  }
};

export const updatePriority = (priority: TaskPriority, isUserAction = false) => {
  const { mode, taskId } = taskFormStore.state;

  // Only allow priority updates in edit mode if it's a user action
  if (mode === 'edit' && !isUserAction) {
    return;
  }

  // Update form store
  taskFormStore.setState((state) => ({
    ...state,
    priority,
    isDirty: true,
    isPriorityManuallySet: isUserAction, // Set the manual flag only for user actions
  }));

  // If in edit mode and it's a user action, update the task store
  if (mode === 'edit' && taskId && isUserAction) {
    updateTask(taskId, { priority });
  }
};

export const updateTimeFixed = (isFixed: boolean) => {
  const { mode, taskId } = taskFormStore.state;

  // Update form store
  taskFormStore.setState((state) => ({
    ...state,
    isTimeFixed: isFixed,
    isDirty: true,
  }));

  // If in edit mode, update the task store
  if (mode === 'edit' && taskId) {
    updateTask(taskId, { isTimeFixed: isFixed });
  }
};

// Helper functions for subtasks
export const addSubtask = (title: string) => {
  taskFormStore.setState((state) => {
    const newSubtask: Subtask = {
      id: uuidv4(),
      title,
      isCompleted: false,
    };

    const updatedSubtasks = [...state.subtasks, newSubtask];

    return {
      ...state,
      subtasks: updatedSubtasks,
      isDirty: true,
    };
  });
};

export const updateSubtask = (subtaskId: string, updates: Partial<Subtask>) => {
  taskFormStore.setState((state) => {
    const updatedSubtasks = state.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, ...updates } : subtask,
    );

    return {
      ...state,
      subtasks: updatedSubtasks,
      isDirty: true,
    };
  });
};

export const deleteSubtask = (subtaskId: string) => {
  taskFormStore.setState((state) => {
    const updatedSubtasks = state.subtasks.filter((subtask) => subtask.id !== subtaskId);

    return {
      ...state,
      subtasks: updatedSubtasks,
      isDirty: true,
    };
  });
};

// Add a new function to update completion status
export const updateCompletionStatus = (completed: boolean) => {
  // const { mode, taskId } = taskFormStore.state; // Not needed if we don't call updateTask

  // Update the form store's internal state only
  taskFormStore.setState((state) => {
    // Only update if the new completion status is different and if we are in edit mode
    // to prevent making the form dirty unnecessarily if it's a create form reflecting an external change.
    if (state.mode === 'edit' && state.completed !== completed) {
      return {
        ...state,
        completed,
        isDirty: true,
      };
    }
    // If not in edit mode, or if 'completed' is already the same, just ensure 'completed' is set if different,
    // but don't mark as dirty if it's not an actual user change to the form being edited.
    // This handles the case where tasks.store informs a create-mode form of a change.
    if (state.completed !== completed) {
      return {
        ...state,
        completed,
        // isDirty remains unchanged unless it was an edit mode change
      };
    }
    return state; // No change needed or not applicable
  });

  // Removed the problematic block that called updateTask:
  // if (mode === 'edit' && taskId) { ... }
};

// Enhanced task editing function
export const editExistingTask = (
  task: OptimalTask,
  values: {
    title: string;
    notes?: string;
    emoji?: string;
    startTime?: string;
    dueTime?: string;
    duration?: number;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: TaskCategory;
    subtasks?: Subtask[];
    progress?: number;
    repetition?: RepetitionOption;
    completed?: boolean;
  },
) => {
  try {
    // Extract values from form or use existing task values
    const updatedValues: Partial<OptimalTask> = {
      title: values.title || task.title,
      notes: values.notes || task.notes,
      emoji: values.emoji || task.emoji,
      priority: values.priority || task.priority,
      category: values.category || task.category,
      subtasks: values.subtasks || task.subtasks || [],
      completed: values.completed !== undefined ? values.completed : task.completed,
    };

    // Calculate progress if subtasks are present
    if (updatedValues.subtasks && updatedValues.subtasks.length > 0) {
      const completedCount = updatedValues.subtasks.filter((s: Subtask) => s.isCompleted).length;
      updatedValues.progress = Math.round((completedCount / updatedValues.subtasks.length) * 100);
    } else {
      updatedValues.progress = values.progress || task.progress || 0;
    }

    try {
      // Handle start time and date
      let taskDate = task.taskDate;
      let timeString = task.time || '';
      let startTime = task.startTime;

      if (values.startTime) {
        timeString = values.startTime;
        startTime = parse(values.startTime, 'HH:mm', parseISO(taskDate));

        // If there's a due time, append it
        if (values.dueTime) {
          timeString += `—${values.dueTime}`;
        }
      }

      // Handle duration
      const duration =
        values.duration && values.duration > 0 ? values.duration : task.duration || 45 * 60 * 1000; // 45 mins fallback

      // Calculate next start time
      const nextStartTime = startTime ? addMilliseconds(startTime, duration) : undefined;

      // Create default repetition option if not provided
      const defaultRepetition: RepetitionOption = {
        type: 'once',
        repeatInterval: 1,
      };

      const finalUpdatedValues = {
        ...updatedValues,
        time: timeString,
        duration,
        taskDate,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        startTime,
        nextStartTime,
        repetition: values.repetition || task.repetition || defaultRepetition,
      };

      updateTask(task.id, finalUpdatedValues);
    } catch (error) {
      console.error('Error parsing dates:', error);
      updateTask(task.id, updatedValues);
    }
  } catch (error) {
    console.error('Failed to edit task:', error);
  }
};

// Add a new function to update emoji from AI
export const updateEmojiFromAi = (emoji: string) => {
  taskFormStore.setState((state) => ({
    ...state,
    emoji,
    isEmojiSetByAi: true,
    isDirty: true,
  }));
};
