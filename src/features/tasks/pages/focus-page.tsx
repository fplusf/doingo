import { Task, tasksStore, updateTask } from '@/store/tasks.store';
import { useParams } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import React from 'react';
import { useSidebar } from '../../../components/ui/sidebar';
import { TaskDetailsRoute } from '../../../routes/routes';
import { TaskDetails } from '../components';

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

  const handleTaskUpdate = (updatedTask: Task) => {
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
