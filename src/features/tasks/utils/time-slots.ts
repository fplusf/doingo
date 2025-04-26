import { OptimalTask } from '../types';

export const findNextAvailableSlot = (
  startTime: Date,
  taskDuration: number,
  tasks: OptimalTask[],
  currentTaskId: string,
  nextTaskId?: string,
  taskDate?: string,
): Date => {
  // Get the task being moved to check if it's time-fixed
  const taskBeingMoved = tasks.find((t) => t.id === nextTaskId);
  if (taskBeingMoved?.isTimeFixed) {
    // If the task is time-fixed, return its original start time
    return taskBeingMoved.startTime || startTime;
  }

  const sortedTasks = [...tasks]
    .filter((t) => t.taskDate === taskDate && t.startTime && t.nextStartTime)
    .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));

  let proposedStartTime = startTime;
  let proposedEndTime = new Date(proposedStartTime.getTime() + taskDuration);

  while (true) {
    const hasOverlap = sortedTasks.some((t) => {
      if (!t.startTime || !t.nextStartTime || t.id === currentTaskId || t.id === nextTaskId)
        return false;

      if (t.isTimeFixed) {
        const taskStart = t.startTime.getTime();
        const taskEnd = t.nextStartTime.getTime();
        const proposedStart = proposedStartTime.getTime();
        const proposedEnd = proposedEndTime.getTime();

        const hasFixedOverlap =
          (proposedStart >= taskStart && proposedStart < taskEnd) ||
          (proposedEnd > taskStart && proposedEnd <= taskEnd) ||
          (proposedStart <= taskStart && proposedEnd >= taskEnd);

        if (hasFixedOverlap) {
          proposedStartTime = new Date(taskEnd);
          proposedEndTime = new Date(proposedStartTime.getTime() + taskDuration);
          return true;
        }
      }

      const taskStart = t.startTime.getTime();
      const taskEnd = t.nextStartTime.getTime();
      const proposedStart = proposedStartTime.getTime();
      const proposedEnd = proposedEndTime.getTime();

      return (
        (proposedStart >= taskStart && proposedStart < taskEnd) ||
        (proposedEnd > taskStart && proposedEnd <= taskEnd) ||
        (proposedStart <= taskStart && proposedEnd >= taskEnd)
      );
    });

    if (!hasOverlap) {
      return proposedStartTime;
    }

    proposedStartTime = new Date(proposedEndTime.getTime());
    proposedEndTime = new Date(proposedStartTime.getTime() + taskDuration);
  }
};
