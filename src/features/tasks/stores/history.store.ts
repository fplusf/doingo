import { OptimalTask } from '../types/task.types';

/**
 * Actions that can be undone/redone
 */
export type HistoryAction =
  | {
      type: 'resolveOverlap';
      taskId: string;
      previousState: OptimalTask;
      nextTaskId?: string;
      nextTaskPreviousState?: OptimalTask;
    }
  | { type: 'deleteTask'; taskId: string; previousState: OptimalTask }
  | { type: 'completeTask'; taskId: string; previousState: OptimalTask };

/**
 * History store to track actions for undo/redo functionality
 */
export interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
}

const MAX_HISTORY_SIZE = 50;

/**
 * Initial history state
 */
export const initialHistoryState: HistoryState = {
  past: [],
  future: [],
};

/**
 * Add an action to history
 */
export const addToHistory = (action: HistoryAction, state: HistoryState): HistoryState => {
  const past = [action, ...state.past].slice(0, MAX_HISTORY_SIZE);

  return {
    past,
    future: [], // Clear future when a new action is performed
  };
};

/**
 * Undo the most recent action
 */
export const undo = (
  state: HistoryState,
): {
  newState: HistoryState;
  action: HistoryAction | undefined;
} => {
  if (state.past.length === 0) {
    return { newState: state, action: undefined };
  }

  const [lastAction, ...restPast] = state.past;

  return {
    newState: {
      past: restPast,
      future: [lastAction, ...state.future],
    },
    action: lastAction,
  };
};

/**
 * Redo the most recently undone action
 */
export const redo = (
  state: HistoryState,
): {
  newState: HistoryState;
  action: HistoryAction | undefined;
} => {
  if (state.future.length === 0) {
    return { newState: state, action: undefined };
  }

  const [nextAction, ...restFuture] = state.future;

  return {
    newState: {
      past: [nextAction, ...state.past],
      future: restFuture,
    },
    action: nextAction,
  };
};

/**
 * Clear history
 */
export const clearHistory = (): HistoryState => ({
  past: [],
  future: [],
});
