import { getNextFifteenMinuteInterval } from '@/shared/helpers/date/next-feefteen-minutes';
import { format } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TaskFormValues } from '../components/schedule';

export interface TaskFormContextType {
  // Form values
  values: TaskFormValues;
  setValues: React.Dispatch<React.SetStateAction<TaskFormValues>>;
  updateValue: <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => void;

  // Time and duration management
  updateStartTime: (time: string) => void;
  updateDueTime: (time: string) => void;
  updateStartDate: (date: Date) => void;
  updateDueDate: (date: Date) => void;
  updateDuration: (durationMs: number) => void;

  // Validation
  errors: Record<string, string>;
  isValid: boolean;

  // Form reset
  resetForm: () => void;
  initializeForm: (initialValues?: Partial<TaskFormValues>) => void;
}

const defaultValues: TaskFormValues = {
  title: '',
  notes: '',
  emoji: '',
  startTime: format(getNextFifteenMinuteInterval(), 'HH:mm'),
  dueTime: '',
  dueDate: undefined,
  duration: 60 * 60 * 1000, // 1 hour in ms
  category: 'work',
  priority: 'medium',
  subtasks: [],
  progress: 0,
};

export const TaskFormContext = createContext<TaskFormContextType | undefined>(undefined);

export const useTaskForm = () => {
  const context = useContext(TaskFormContext);
  if (context === undefined) {
    throw new Error('useTaskForm must be used within a TaskFormProvider');
  }
  return context;
};

export function TaskFormProvider({
  children,
  initialValues,
}: {
  children: React.ReactNode;
  initialValues?: Partial<TaskFormValues>;
}) {
  const [values, setValues] = useState<TaskFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      initializeForm(initialValues);
    }
  }, [initialValues]);

  const updateValue = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Time and duration management
  const updateStartTime = (time: string) => {
    updateValue('startTime', time);
  };

  const updateStartDate = (date: Date) => {
    updateValue('startDate', date);
  };

  const updateDueDate = (date: Date) => {
    updateValue('dueDate', date);
  };

  const updateDueTime = (time: string) => {
    updateValue('dueTime', time);
  };

  const updateDuration = (durationMs: number) => {
    updateValue('duration', durationMs);
  };

  const resetForm = () => {
    setValues(defaultValues);
    setErrors({});
  };

  const initializeForm = (initialValues?: Partial<TaskFormValues>) => {
    if (initialValues) {
      setValues({
        ...defaultValues,
        ...initialValues,
      });
    } else {
      resetForm();
    }
  };

  const isValid = Object.keys(errors).length === 0;

  const value = {
    values,
    setValues,
    updateValue,
    updateStartTime,
    updateDueTime,
    updateStartDate,
    updateDueDate,
    updateDuration,
    errors,
    isValid,
    resetForm,
    initializeForm,
  };

  return <TaskFormContext.Provider value={value}>{children}</TaskFormContext.Provider>;
}
