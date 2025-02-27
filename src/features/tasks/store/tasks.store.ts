import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { OptimalTask, TasksState } from '../types';

// Initialize the storage adapter (can be easily swapped with a different implementation)
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Get today's date as a string in YYYY-MM-DD format
const today = format(new Date(), 'yyyy-MM-dd');

// Initialize store with tasks from storage
export const tasksStore = new Store<TasksState>({
  tasks: storageAdapter.getTasks().map((task) => ({
    ...task,
    taskDate: task.taskDate || today, // Ensure all tasks have a taskDate, defaulting to today
  })),
  selectedDate: today,
});

// Helper function to update state and storage
const updateStateAndStorage = (updater: (state: TasksState) => TasksState) => {
  const newState = updater(tasksStore.state);
  tasksStore.setState(() => newState);
  storageAdapter.saveTasks(newState.tasks);
};

export const setSelectedDate = (date: string) => {
  tasksStore.setState((state) => ({
    ...state,
    selectedDate: date,
  }));
};

export const getTasksByDate = (date: string) => {
  return tasksStore.state.tasks.filter((task) => task.taskDate === date);
};

export const addTask = (task: Omit<OptimalTask, 'id'>) => {
  // Set the taskDate to the selectedDate if not provided
  const taskDate = task.taskDate || tasksStore.state.selectedDate;

  updateStateAndStorage((state) => ({
    ...state,
    tasks: [
      ...state.tasks,
      {
        ...task,
        id: uuidv4(),
        priority: task.priority || 'none',
        taskDate,
      },
    ],
  }));
};

export const updateTask = (id: string, updates: Partial<OptimalTask>) => {
  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  }));
};

export const deleteTask = (id: string) => {
  // remove the canvas data from local storage
  if (id) {
    localStorage.removeItem(`canvas_${id}`);
  }

  updateStateAndStorage((state) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== id),
  }));
};

export const setFocused = (id: string, isFocused: boolean) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  updateStateAndStorage((state) => {
    // Find the task that should be focused
    const taskToFocus = state.tasks.find((task) => task.id === id);

    // If the task is not for today, don't allow focusing
    if (taskToFocus && taskToFocus.taskDate !== today && isFocused) {
      return state;
    }

    return {
      ...state,
      tasks: state.tasks.map((task) => {
        if (task.id === id) {
          return { ...task, isFocused };
        }
        // Ensure other tasks are unfocused
        return { ...task, isFocused: false };
      }),
    };
  });
};

export const toggleTaskCompletion = (id: string) => {
  // First, get information about the task before changing it
  const tasks = tasksStore.state.tasks;
  const taskToToggle = tasks.find((task) => task.id === id);

  if (!taskToToggle) return;

  const wasFocused = taskToToggle.isFocused;
  const isBeingCompleted = !taskToToggle.completed;
  const taskDate = taskToToggle.taskDate;
  const category = taskToToggle.category;

  // Toggle the task completion status and handle reordering
  updateStateAndStorage((state) => {
    const stateTasks = [...state.tasks];

    // 1. Remove the task we're toggling
    const filteredTasks = stateTasks.filter((task) => task.id !== id);

    // 2. Create the updated task with toggled completion
    const updatedTask = {
      ...taskToToggle,
      completed: !taskToToggle.completed,
      isFocused: false, // Always remove focus when toggling completion
    };

    // 3. Find the correct insertion point based on completion status
    let insertIndex;

    if (updatedTask.completed) {
      // If it's being completed, find tasks of the same category and date
      const sameCategoryTasks = filteredTasks.filter(
        (t) => t.category === category && t.taskDate === taskDate,
      );

      // Find completed tasks of this category
      const completedCategoryTasks = sameCategoryTasks.filter((t) => t.completed);

      if (completedCategoryTasks.length > 0) {
        // If there are completed tasks, insert after the last completed one
        const lastCompletedTask = [...completedCategoryTasks].pop();
        insertIndex = lastCompletedTask
          ? filteredTasks.findIndex((t) => t.id === lastCompletedTask.id) + 1
          : 0;
      } else if (sameCategoryTasks.length > 0) {
        // If no completed tasks, insert at the beginning of this category
        insertIndex = filteredTasks.findIndex((t) => t.id === sameCategoryTasks[0].id);
      } else {
        // No other tasks in this category, find appropriate insertion point among other categories
        const sameDate = filteredTasks.filter((t) => t.taskDate === taskDate);

        // If there are no tasks for this date yet, add at the beginning
        if (sameDate.length === 0) {
          insertIndex = 0;
        } else {
          // Otherwise, find the first task of the appropriate category based on priority
          const categoryOrder: Record<string, number> = { work: 0, passion: 1, play: 2 };
          const categoryPriority = categoryOrder[category as keyof typeof categoryOrder];

          // Find the first category with higher priority
          for (let i = 0; i <= categoryPriority; i++) {
            const catName = Object.keys(categoryOrder).find(
              (key) => categoryOrder[key as keyof typeof categoryOrder] === i,
            );
            const firstTaskOfCategory = sameDate.find((t) => t.category === catName);

            if (firstTaskOfCategory) {
              insertIndex = filteredTasks.findIndex((t) => t.id === firstTaskOfCategory.id);
              break;
            }
          }

          // If no insertion point found, add at the beginning
          if (insertIndex === undefined) {
            insertIndex = 0;
          }
        }
      }
    } else {
      // If it's being uncompleted, find the first uncompleted task of the same category
      // First, we need to find all completed tasks of this category
      const completedCategoryTasks = filteredTasks.filter(
        (t) => t.completed && t.category === category && t.taskDate === taskDate,
      );

      // Then find the first uncompleted task
      const firstUncompletedTask = filteredTasks.find(
        (t) => !t.completed && t.category === category && t.taskDate === taskDate,
      );

      if (completedCategoryTasks.length > 0) {
        // If there are completed tasks, insert after the last completed one
        const lastCompletedTask = [...completedCategoryTasks].pop();
        insertIndex = lastCompletedTask
          ? filteredTasks.findIndex((t) => t.id === lastCompletedTask.id) + 1
          : 0;
      } else if (firstUncompletedTask) {
        // If no completed tasks but there are uncompleted ones, insert at the beginning of uncompleted
        insertIndex = filteredTasks.findIndex((t) => t.id === firstUncompletedTask.id);
      } else {
        // No tasks of this category, find the appropriate place based on category priority
        const sameDate = filteredTasks.filter((t) => t.taskDate === taskDate);

        // If there are no tasks for this date yet, add at the beginning
        if (sameDate.length === 0) {
          insertIndex = 0;
        } else {
          // Otherwise, find the first task of the appropriate category based on priority
          const categoryOrder: Record<string, number> = { work: 0, passion: 1, play: 2 };
          const categoryPriority = categoryOrder[category as keyof typeof categoryOrder];

          // Find the first category with higher priority
          for (let i = 0; i <= categoryPriority; i++) {
            const catName = Object.keys(categoryOrder).find(
              (key) => categoryOrder[key as keyof typeof categoryOrder] === i,
            );
            const firstTaskOfCategory = sameDate.find((t) => t.category === catName);

            if (firstTaskOfCategory) {
              insertIndex = filteredTasks.findIndex((t) => t.id === firstTaskOfCategory.id);
              break;
            }
          }

          // If no insertion point found, add at the beginning
          if (insertIndex === undefined) {
            insertIndex = 0;
          }
        }
      }
    }

    // 4. Insert the task at the calculated position
    const reorderedTasks = [...filteredTasks];
    reorderedTasks.splice(insertIndex, 0, updatedTask);

    return {
      ...state,
      tasks: reorderedTasks,
    };
  });

  // If the task was focused and is now completed, focus the next task
  if (wasFocused && isBeingCompleted) {
    // Wait a small amount of time to ensure the state is updated
    setTimeout(() => {
      // Get the updated tasks after the completion toggle
      const updatedTasks = tasksStore.state.tasks;

      // Find the next uncompleted task for the same date
      const nextUncompletedTask = updatedTasks
        .filter((task) => task.taskDate === taskDate && !task.completed)
        .sort((a, b) => {
          // Sort by category first
          const categoryOrder = { work: 0, passion: 1, play: 2 };
          return categoryOrder[a.category] - categoryOrder[b.category];
        })[0]; // Get the first task

      // If there's a next task, focus it
      if (nextUncompletedTask) {
        setFocused(nextUncompletedTask.id, true);
      }
    }, 0);
  }
};

export const clearTasks = () => {
  storageAdapter.clear();
  tasksStore.setState(() => ({
    tasks: [],
    selectedDate: today,
  }));
};
