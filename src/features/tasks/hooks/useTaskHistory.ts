import { useHistoryState } from '@uidotdev/usehooks';
import { useCallback, useEffect } from 'react';
import { HistoryState, initialHistoryState } from '../stores/history.store';
import { deleteTask, updateTask } from '../stores/tasks.store';
import { OptimalTask } from '../types/task.types';
// Import here to avoid circular dependency
import { addTask, tasksStore } from '../stores/tasks.store';

/**
 * Custom hook to manage task history with undo/redo functionality
 */
export const useTaskHistory = () => {
  // Use the useHistoryState hook for managing the history state
  const {
    state: historyState,
    set: setHistoryState,
    canUndo,
    canRedo,
  } = useHistoryState<HistoryState>(initialHistoryState);

  // Add overlap resolver action to history
  const addOverlapResolverAction = useCallback(
    (
      taskId: string,
      previousState: OptimalTask,
      nextTaskId?: string,
      nextTaskPreviousState?: OptimalTask,
    ) => {
      setHistoryState({
        ...historyState,
        past: [
          {
            type: 'resolveOverlap',
            taskId,
            previousState,
            nextTaskId,
            nextTaskPreviousState,
          },
          ...historyState.past,
        ],
        future: [], // Clear future on new action
      });
    },
    [historyState, setHistoryState],
  );

  // Add task delete action to history
  const addDeleteTaskAction = useCallback(
    (taskId: string, previousState: OptimalTask) => {
      setHistoryState({
        ...historyState,
        past: [{ type: 'deleteTask', taskId, previousState }, ...historyState.past],
        future: [], // Clear future on new action
      });
    },
    [historyState, setHistoryState],
  );

  // Add task completion action to history
  const addCompleteTaskAction = useCallback(
    (taskId: string, previousState: OptimalTask) => {
      setHistoryState({
        ...historyState,
        past: [{ type: 'completeTask', taskId, previousState }, ...historyState.past],
        future: [], // Clear future on new action
      });
    },
    [historyState, setHistoryState],
  );

  // Undo the last action
  const undo = useCallback(() => {
    if (!canUndo) return;

    const { past, future } = historyState;
    if (past.length === 0) return;

    const [lastAction, ...restPast] = past;

    // Handle the action based on its type
    switch (lastAction.type) {
      case 'resolveOverlap':
        // Restore the previous task state
        updateTask(lastAction.taskId, lastAction.previousState);

        // If there was a next task affected, restore it too
        if (lastAction.nextTaskId && lastAction.nextTaskPreviousState) {
          updateTask(lastAction.nextTaskId, lastAction.nextTaskPreviousState);
        }
        break;

      case 'deleteTask':
        // Restore the deleted task
        // We use addTask as the task was actually deleted
        addTask(lastAction.previousState);
        break;

      case 'completeTask':
        // Toggle task completion state back to previous state
        // We don't use toggleTaskCompletion directly as it would add a new history entry
        updateTask(lastAction.taskId, {
          completed: lastAction.previousState.completed,
          duration: lastAction.previousState.duration,
          nextStartTime: lastAction.previousState.nextStartTime,
        });
        break;
    }

    // Update history state
    setHistoryState({
      past: restPast,
      future: [lastAction, ...future],
    });
  }, [canUndo, historyState, setHistoryState]);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (!canRedo) return;

    const { past, future } = historyState;
    if (future.length === 0) return;

    const [nextAction, ...restFuture] = future;

    // Handle the action based on its type
    switch (nextAction.type) {
      case 'resolveOverlap':
        // We need to perform the overlap resolution again
        if (nextAction.nextTaskId) {
          // Move the next task to start after the current task
          const currentTask = tasksStore.state.tasks.find((t) => t.id === nextAction.taskId);
          if (currentTask && currentTask.nextStartTime) {
            updateTask(nextAction.nextTaskId, {
              startTime: currentTask.nextStartTime,
              nextStartTime:
                currentTask.duration && nextAction.nextTaskPreviousState?.duration
                  ? new Date(
                      currentTask.nextStartTime.getTime() +
                        nextAction.nextTaskPreviousState.duration,
                    )
                  : undefined,
            });
          }
        }
        break;

      case 'deleteTask':
        // Delete the task again
        deleteTask(nextAction.taskId);
        break;

      case 'completeTask':
        // Toggle completion state again
        // We don't use toggleTaskCompletion directly as it would add a new history entry
        const oppositeCompleted = !nextAction.previousState.completed;
        updateTask(nextAction.taskId, {
          completed: oppositeCompleted,
          // If it was completed, also set duration to the current completion time
          ...(oppositeCompleted && {
            duration: new Date().getTime() - (nextAction.previousState.startTime?.getTime() || 0),
            nextStartTime: new Date(),
          }),
        });
        break;
    }

    // Update history state
    setHistoryState({
      past: [nextAction, ...past],
      future: restFuture,
    });
  }, [canRedo, historyState, setHistoryState]);

  // Set up keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Cmd+Shift+Z or Ctrl+Shift+Z for Redo
          e.preventDefault();
          redo();
        } else {
          // Cmd+Z or Ctrl+Z for Undo
          e.preventDefault();
          undo();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return {
    addOverlapResolverAction,
    addDeleteTaskAction,
    addCompleteTaskAction,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
