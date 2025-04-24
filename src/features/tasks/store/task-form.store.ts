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

  // Subtasks
  subtasks: Subtask[];
  progress: number;

  // Form state
  mode: 'create' | 'edit';
  taskId: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Get today's date
const today = new Date();

// Get the default start time
const defaultTimeString = getDefaultStartTime();
const [hours, minutes] = defaultTimeString.split(':').map(Number);
const defaultStartTime = new Date(today);
defaultStartTime.setHours(hours, minutes, 0, 0);

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
  duration: ONE_HOUR_IN_MS, // 1 hour in ms
  dueDate: undefined,
  dueTime: '',
  repetition: 'once',
  repeatInterval: 1,

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

// Helper function to reset the form to its initial state
export const resetForm = () => {
  // Generate fresh default time values
  const freshDefaultTimeString = getDefaultStartTime();
  const [h, m] = freshDefaultTimeString.split(':').map(Number);
  const freshStartTime = new Date();
  freshStartTime.setHours(h, m, 0, 0);

  taskFormStore.setState((state) => ({
    ...initialState,
    startDate: freshStartTime,
    startTime: freshDefaultTimeString,
  }));
};

// Enhanced updateField function with optimistic updates
export const updateField = <K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) => {
  // Get current state
  const { mode, taskId } = taskFormStore.state;

  // Update form store first
  taskFormStore.setState((state) => ({
    ...state,
    [field]: value,
  }));

  // Optimistically update the task store for selected fields
  if (
    mode === 'edit' &&
    taskId &&
    (field === 'title' || field === 'emoji' || field === 'priority')
  ) {
    // Create an update object with just this field
    const update = { [field]: value } as Partial<OptimalTask>;

    // Update the task in the store
    updateTask(taskId, update);
    console.log(`Optimistically updated ${field} for task ${taskId}`);
  }
};

// Helper function to update multiple fields at once
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

  taskFormStore.setState((state) => ({
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
    subtasks: taskData.subtasks || [],
    progress: taskData.progress || 0,
    mode: 'edit',
    taskId: taskData.id,
    isSubmitting: false,
    isDirty: false,
  }));
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

// Scheduling helpers
export const updateStartDateTime = (date: Date, time: string | null | undefined) => {
  taskFormStore.setState((state) => {
    // Ensure time is a string and not empty
    const timeString = typeof time === 'string' && time.length > 0 ? time : '';

    // Parse the start time
    const startTimeComponents = timeString.split(':').map(Number);
    const newStartDate = new Date(date);

    // Only set hours and minutes if we have valid components
    if (
      startTimeComponents.length >= 2 &&
      !isNaN(startTimeComponents[0]) &&
      !isNaN(startTimeComponents[1])
    ) {
      newStartDate.setHours(startTimeComponents[0], startTimeComponents[1], 0, 0);

      // If we're in edit mode and have a taskId, sync with main store
      // Only sync if we have valid time components and a non-empty timeString
      if (state.mode === 'edit' && state.taskId && timeString) {
        const validTimeString: string = timeString; // Type assertion after validation
        import('./tasks.store').then(({ updateTaskStartDateTime }) => {
          updateTaskStartDateTime(state.taskId!, newStartDate, validTimeString);
        });
      }
    }

    return {
      ...state,
      startDate: newStartDate,
      startTime: timeString,
      isDirty: true,
    };
  });
};

export const updateDuration = (durationMs: number) => {
  // Get current state for reference
  const currentState = taskFormStore.state;
  const { mode, taskId } = currentState;

  // Update the form store first
  taskFormStore.setState((state) => ({
    ...state,
    duration: durationMs,
    // If we're changing duration, we may need to recalculate other timing fields
    // This depends on your specific requirements
  }));

  // If we're in edit mode and have a valid taskId, optimistically update the task store too
  if (mode === 'edit' && taskId) {
    // Apply the same duration update to the actual task
    updateTaskDuration(taskId, durationMs);

    // No need to wait for confirmation since this is optimistic
    console.log(`Optimistically updated duration for task ${taskId} to ${durationMs}ms`);
  }
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

export const updateRepeatInterval = (interval: number) => {
  taskFormStore.setState((state) => ({
    ...state,
    repeatInterval: interval,
    isDirty: true,
  }));
};

// Generate full form data for submission
export const getFormValues = () => {
  const state = taskFormStore.state;
  return {
    title: state.title,
    notes: state.notes,
    emoji: state.emoji,
    category: state.category,
    priority: state.priority,
    startDate: state.startDate,
    startTime: state.startTime,
    duration: state.duration,
    dueDate: state.dueDate,
    dueTime: state.dueTime,
    repetition: state.repetition,
    repeatInterval: state.repeatInterval,
    subtasks: state.subtasks,
    progress: state.progress,
    taskId: state.taskId,
  };
};

// Submit the form - just logs the values for now
export const submitForm = () => {
  const formValues = getFormValues();
  console.log('Submitting task form:', formValues);
  return formValues;
};
