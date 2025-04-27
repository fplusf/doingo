import { findEmojiForTitle } from '@/lib/emoji-matcher';
import { Store } from '@tanstack/react-store';
import { v4 as uuidv4 } from 'uuid';
import {
  ONE_HOUR_IN_MS,
  OptimalTask,
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

  // Form state
  mode: 'create' | 'edit';
  taskId: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Get the current time for default values
const now = new Date();

// Default to current hour, rounded to the nearest 15 minutes
// Get the current date
const defaultStartTime = now;
// Round minutes to the nearest 15
const minutes = Math.round(now.getMinutes() / 15) * 15;
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

  // Form state
  mode: 'create',
  taskId: null,
  isSubmitting: false,
  isDirty: false,
};

// Create the store
export const taskFormStore = new Store<TaskFormState>(initialState);

// Update a single field with setting the dirty flag
export const updateField = <K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) => {
  taskFormStore.setState((state) => ({
    ...state,
    [field]: value,
    isDirty: true,
  }));

  // If this is a title update and we're in create mode, automatically suggest an emoji
  if (field === 'title' && typeof value === 'string' && taskFormStore.state.mode === 'create') {
    const emoji = findEmojiForTitle(value);
    // Debug log to see what's happening
    console.log('Title update triggered emoji suggestion:', {
      title: value,
      suggestedEmoji: emoji,
      currentEmoji: taskFormStore.state.emoji,
    });

    // Force update the emoji for testing - this should always work
    if (emoji) {
      console.log('Updating emoji to:', emoji);
      taskFormStore.setState((state) => ({
        ...state,
        emoji,
      }));

      // Double check that it was updated
      setTimeout(() => {
        console.log('Emoji after update:', taskFormStore.state.emoji);
      }, 0);
    }
  }
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
    category: taskData.category || 'work',
    priority: taskData.priority || 'medium',
    startDate: taskData.startTime || new Date(),
    startTime: startTimeString,
    duration: taskData.duration || ONE_HOUR_IN_MS,
    dueDate: taskData.dueDate,
    dueTime: taskData.dueTime || '',
    repetition: taskData.repetition?.type || 'once',
    repeatInterval: taskData.repetition?.repeatInterval || 1,
    isTimeFixed: taskData.isTimeFixed || false,
    subtasks: taskData.subtasks || [],
    progress: taskData.progress || 0,
    mode: 'edit',
    taskId: taskData.id,
    isSubmitting: false,
    isDirty: false,
  }));
};

// Reset the form to the default state
export const resetForm = () => {
  // Get the previous duration to preserve it
  const previousDuration = taskFormStore.state.duration;

  // Get fresh defaults for time
  const now = new Date();
  const defaultStartTime = new Date();
  const minutes = Math.round(now.getMinutes() / 15) * 15;
  defaultStartTime.setMinutes(minutes % 60);
  if (minutes === 60) {
    defaultStartTime.setHours(defaultStartTime.getHours() + 1);
    defaultStartTime.setMinutes(0);
  }
  defaultStartTime.setSeconds(0);
  defaultStartTime.setMilliseconds(0);
  const defaultTimeString = `${defaultStartTime.getHours().toString().padStart(2, '0')}:${defaultStartTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  taskFormStore.setState(() => ({
    // Basic task info
    title: '',
    notes: '',
    emoji: '',

    // Task categorization
    category: 'work',
    priority: 'medium',

    // Scheduling
    startDate: defaultStartTime,
    startTime: defaultTimeString,
    // Preserve the previous duration instead of resetting to default
    duration: previousDuration,
    dueDate: undefined,
    dueTime: '',
    repetition: 'once',
    repeatInterval: 1,
    isTimeFixed: false,

    // Subtasks
    subtasks: [],
    progress: 0,

    // Form state
    mode: 'create',
    taskId: null,
    isSubmitting: false,
    isDirty: false,
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
  console.log(`updateDuration called with ${durationMs}ms (${durationMs / (60 * 1000)} minutes)`);

  // Get current state for reference
  const currentState = taskFormStore.state;
  const { mode, taskId } = currentState;

  // Update the form store first
  taskFormStore.setState((state) => ({
    ...state,
    duration: durationMs,
    isDirty: true,
  }));

  // If we're in edit mode and have a valid taskId, optimistically update the task store too
  if (mode === 'edit' && taskId) {
    // Apply the same duration update to the actual task
    updateTaskDuration(taskId, durationMs);

    // No need to wait for confirmation since this is optimistic
    console.log(`Optimistically updated duration for task ${taskId} to ${durationMs}ms`);
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
