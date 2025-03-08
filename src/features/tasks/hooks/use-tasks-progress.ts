import { tasksStore } from '@/features/tasks/store/tasks.store';
import { useStore } from '@tanstack/react-store';

export const useTasksProgress = () => {
  const tasks = useStore(tasksStore, (state) => state.tasks);

  const getProgressForDate = (dateString: string): number => {
    // Filter tasks for the given date
    const dayTasks = tasks.filter((task) => task.taskDate === dateString);

    if (dayTasks.length === 0) return 0;

    // Calculate progress based on completion status and individual task progress
    const totalTasks = dayTasks.length;
    let completedValue = 0;

    dayTasks.forEach((task) => {
      if (task.completed) {
        // If task is completed, count as full value
        completedValue += 1;
      } else if (task.progress !== undefined && task.progress > 0) {
        // For incomplete tasks with subtasks, count partial completion
        completedValue += task.progress / 100;
      }
    });

    // Calculate overall percentage and round to nearest integer
    return Math.round((completedValue / totalTasks) * 100);
  };

  return { getProgressForDate };
};
