import React from 'react';
import { useParams } from '@tanstack/react-router';
import { TaskDetails } from '@/components/task-details/task-details';
import { Task, tasksStore, updateTask } from '@/store/tasks.store';
import { useStore } from '@tanstack/react-store';
import { TaskDetailsRoute } from '../routes/routes';

interface TaskDetailsPageProps {
  taskId: string;
}

const TaskDetailsPage: React.FC<TaskDetailsPageProps> = () => {
  const { taskId } = useParams({ from: TaskDetailsRoute.fullPath });
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const task = tasks.find((t) => t.id === taskId);

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
    <div className="h-[calc(100vh-4rem)] overflow-auto">
      <TaskDetails task={task} onEdit={handleTaskUpdate} />
    </div>
  );
};

export default TaskDetailsPage;
