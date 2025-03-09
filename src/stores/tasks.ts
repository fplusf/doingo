import { RepetitionOption } from '@/features/tasks/components/schedule/repetition-picker';
import { Store } from '@tanstack/store';

interface ScheduleState {
  startDate?: Date;
  startTime?: string;
  dueDate?: Date;
  dueTime?: string;
  duration: number;
  repetition: RepetitionOption;
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
