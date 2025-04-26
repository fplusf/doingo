import { createContext, ReactNode, useContext } from 'react';
import { useTaskHistory } from '../hooks/useTaskHistory';

// Create the context for task history
export const TaskHistoryContext = createContext<ReturnType<typeof useTaskHistory> | null>(null);

// Provider component
export const TaskHistoryProvider = ({ children }: { children: ReactNode }) => {
  const taskHistory = useTaskHistory();

  return <TaskHistoryContext.Provider value={taskHistory}>{children}</TaskHistoryContext.Provider>;
};

// Custom hook to use the task history
export const useTaskHistoryContext = () => {
  const context = useContext(TaskHistoryContext);
  if (!context) {
    throw new Error('useTaskHistoryContext must be used within a TaskHistoryProvider');
  }
  return context;
};
