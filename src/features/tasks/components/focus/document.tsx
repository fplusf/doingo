import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { OptimalTask, Subtask } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { toggleTaskCompletion, updateTask } from '../../store/tasks.store';
import { TaskScheduler } from '../schedule/task-scheduler';
import TaskNotes from './notes';
import { SubtaskList } from './subtasks';

interface TaskDocumentProps {
  task: OptimalTask;
  onEdit?: (task: OptimalTask) => void; // Keep for backward compatibility
  className?: string;
}

export function TaskDocument({ task, onEdit, className }: TaskDocumentProps) {
  // Extract task ID for all update operations
  const taskId = task.id;

  // Handler for updating the task title
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newTitle = e.target.value;
      updateTask(taskId, { title: newTitle });
      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, title: newTitle });
    },
    [taskId, task, onEdit],
  );

  // Handler for updating the task emoji
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      updateTask(taskId, { emoji });
      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, emoji });
    },
    [taskId, task, onEdit],
  );

  // Handler for toggling task completion
  const handleTaskCompletedChange = useCallback(
    (completed: boolean) => {
      toggleTaskCompletion(taskId);
      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, completed: !task.completed });
    },
    [taskId, task, onEdit],
  );

  // Handler for updating task notes
  const handleNotesChange = useCallback(
    (content: string) => {
      updateTask(taskId, { notes: content });
      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, notes: content });
    },
    [taskId, task, onEdit],
  );

  // Handler for adding a subtask
  const handleAddSubtask = useCallback(
    (title: string) => {
      const newSubtask: Subtask = {
        id: uuidv4(),
        title,
        isCompleted: false,
      };

      // Get current subtasks and add the new one
      const updatedSubtasks = [...(task.subtasks || []), newSubtask];

      // Calculate new progress
      const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
      const progress =
        updatedSubtasks.length > 0
          ? Math.round((completedCount / updatedSubtasks.length) * 100)
          : 0;

      // Update the task
      updateTask(taskId, {
        subtasks: updatedSubtasks,
        progress,
      });

      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, subtasks: updatedSubtasks, progress });
    },
    [taskId, task, onEdit],
  );

  return (
    <div className={cn(className, 'flex h-full flex-col')}>
      {/* Schedule Information - Sticky Header */}
      <div className="z-8 sticky top-0 flex bg-background pb-6 pt-5">
        <div className="flex-1">
          <EmojiPicker emoji={task.emoji} onEmojiSelect={handleEmojiSelect} className="text-3xl" />
        </div>
        <TaskScheduler className="flex-1 text-muted-foreground" taskId={taskId} isDraft={false} />
      </div>

      <ScrollArea
        className="flex flex-1 items-start will-change-scroll"
        preserveScrollPosition={true}
      >
        <section className="mb-2 flex items-baseline justify-between border-b border-gray-700/40 pb-2">
          <TaskCheckbox
            checked={task.completed}
            onCheckedChange={handleTaskCompletedChange}
            size="lg"
            ariaLabel={`Toggle subtask: ${task.title}`}
          />
          <textarea
            placeholder="Task Title"
            value={task.title}
            onChange={handleTitleChange}
            className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent px-4 text-2xl font-semibold tracking-tight focus:outline-none"
          />
        </section>

        <TaskNotes initialContent={task.notes || ''} onContentChange={handleNotesChange} />

        <SubtaskList
          subtasks={task.subtasks || []}
          onToggle={(subtaskId, isCompleted) => {
            const updatedSubtasks = (task.subtasks || []).map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
            );

            const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
            const progress =
              updatedSubtasks.length > 0
                ? Math.round((completedCount / updatedSubtasks.length) * 100)
                : 0;

            updateTask(taskId, { subtasks: updatedSubtasks, progress });
            if (onEdit) onEdit({ ...task, subtasks: updatedSubtasks, progress });
          }}
          onEdit={(subtaskId, title) => {
            const updatedSubtasks = (task.subtasks || []).map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, title } : subtask,
            );
            updateTask(taskId, { subtasks: updatedSubtasks });
            if (onEdit) onEdit({ ...task, subtasks: updatedSubtasks });
          }}
          onDelete={(subtaskId) => {
            const updatedSubtasks = (task.subtasks || []).filter(
              (subtask) => subtask.id !== subtaskId,
            );

            const completedCount = updatedSubtasks.filter((s) => s.isCompleted).length;
            const progress =
              updatedSubtasks.length > 0
                ? Math.round((completedCount / updatedSubtasks.length) * 100)
                : 0;

            updateTask(taskId, { subtasks: updatedSubtasks, progress });
            if (onEdit) onEdit({ ...task, subtasks: updatedSubtasks, progress });
          }}
          onAdd={handleAddSubtask}
        />
      </ScrollArea>
    </div>
  );
}
