import { useEffect, useState } from 'react';

const SUBTASKS_COLLAPSE_KEY = 'doingo_subtasks_collapsed';

export const useSubtasksCollapse = () => {
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(SUBTASKS_COLLAPSE_KEY);
      return stored ? JSON.parse(stored) : false; // Default to collapsed
    } catch {
      return false; // Default to collapsed on error
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUBTASKS_COLLAPSE_KEY, JSON.stringify(isSubtasksOpen));
    } catch (error) {
      console.error('Failed to save subtasks collapse state:', error);
    }
  }, [isSubtasksOpen]);

  return {
    isSubtasksOpen,
    setIsSubtasksOpen,
  };
};
