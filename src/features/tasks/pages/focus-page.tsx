import { setFocused, tasksStore, updateTask } from '@/features/tasks/store/tasks.store';
import { useSidebar } from '@/shared/components/ui/sidebar';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import React, { useEffect } from 'react';
import { toggleSidebarState } from '../../../layouts/store/layout.store';
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
  const navigate = useNavigate();

  // Hide sidebar when entering task details page
  useEffect(() => {
    toggleSidebarState(true); // true = closed
    return () => {
      // Optionally restore sidebar when leaving the page
      toggleSidebarState(false);
    };
  }, []);

  // Redirect to first task if task not found
  useEffect(() => {
    if (!task) {
      const firstUncompletedTask = tasks.find((t) => !t.completed);

      if (firstUncompletedTask) {
        // Set focus on the first task and navigate to it
        setFocused(firstUncompletedTask.id, true);
        navigate({ to: '/tasks/$taskId', params: { taskId: firstUncompletedTask.id } });
      } else {
        // If no tasks available, navigate back to tasks page
        navigate({ to: '/tasks' });
      }
      return;
    }

    // Set this task as focused when viewing it
    if (!task.isFocused) {
      setFocused(task.id, true);
    }
  }, [task, tasks, taskId, navigate]);

  // Handle not found case with a loading state while redirection happens
  if (!task) {
    return <div className="flex h-full w-full items-center justify-center">Loading task...</div>;
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
