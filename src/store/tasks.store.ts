import { Store } from '@tanstack/react-store';
import { v4 as uuidv4 } from 'uuid';

export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

export interface Task {
  id: string;
  title: string;
  time: string;
  startTime: Date;
  nextStartTime: Date;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: Date;
}

interface TasksState {
  tasks: Task[];
}

export const tasksStore = new Store<TasksState>({
  tasks: [],
});

export const addTask = (task: Omit<Task, 'id'>) => {
  tasksStore.setState((state) => ({
    tasks: [...state.tasks, { ...task, id: uuidv4() }],
  }));
};

export const updateTask = (id: string, updates: Partial<Task>) => {
  tasksStore.setState((state) => ({
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  }));
};

export const deleteTask = (id: string) => {
  tasksStore.setState((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  }));
};

export const toggleTaskCompletion = (id: string) => {
  tasksStore.setState((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ),
  }));
};
