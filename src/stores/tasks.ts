import { RepetitionType } from '@/features/tasks/types';
import { Store } from '@tanstack/store';

interface ScheduleState {
  startDate?: Date;
  startTime?: string;
  dueDate?: Date;
  dueTime?: string;
  duration: number;
  repetition: RepetitionType;
}

interface TaskState {
  schedules: Record<string, ScheduleState>;
}

const initialState: TaskState = {
  schedules: {},
};

export const taskStore = new Store<TaskState>(initialState);

// Create a hook to access the store in React components
export function useTaskStore() {
  return {
    updateSchedule: (taskId: string, schedule: ScheduleState) => {
      taskStore.setState((state) => ({
        schedules: {
          ...state.schedules,
          [taskId]: schedule,
        },
      }));
    },
  };
}
