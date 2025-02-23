import { tasksStore, updateTask } from '@/features/tasks/store/tasks.store';
import { useSidebar } from '@/shared/components/ui/sidebar';
import { useParams } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import React from 'react';
import { TaskDetailsRoute } from '../../../routes/routes';
import { TaskDetails } from '../components';
import { OptimalTask } from '../types';

interface TaskDetailsPageProps {
  taskId: string;
}

const TaskDetailsPage: React.FC<TaskDetailsPageProps> = () => {
  const { taskId } = useParams({ from: TaskDetailsRoute.fullPath });
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const task = tasks.find((t) => t.id === taskId);
  const sidebar = useSidebar();

  if (!task) {
    return <div>Task not found</div>;
  }

  const handleTaskUpdate = (updatedTask: OptimalTask) => {
    const taskToUpdate = tasks.find((t) => t.id === updatedTask.id);

    if (!taskToUpdate) {
      return;
    }

    updateTask(updatedTask.id, updatedTask);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <TaskDetails task={task} onEdit={handleTaskUpdate} />
    </div>
  );
};

export default TaskDetailsPage;
