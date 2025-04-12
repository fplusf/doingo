import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { OptimalTask } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import React, { useCallback } from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { toggleTaskCompletion, updateTask } from '../../store/tasks.store';
import CollapsedContainer from '../schedule/collapsed-container';
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

  return (
    <div className={cn(className, 'flex h-full flex-col')}>
      {/* Schedule Information - Sticky Header */}
      <div className="z-8 sticky top-0 flex bg-background pb-6 pl-3 pt-5">
        <div className="flex-1">
          <EmojiPicker emoji={task.emoji} onEmojiSelect={handleEmojiSelect} className="text-3xl" />
        </div>
        <CollapsedContainer>
          <TaskScheduler className="flex-1 text-muted-foreground" taskId={taskId} />
        </CollapsedContainer>
      </div>

      <ScrollArea
        className="flex flex-1 items-start will-change-scroll"
        preserveScrollPosition={true}
      >
        <section className="mb-6 flex items-baseline justify-between border-b border-gray-700/40 pb-2 pl-5">
          <TaskCheckbox
            checked={task.completed}
            onCheckedChange={handleTaskCompletedChange}
            size="lg"
            ariaLabel={`Toggle task: ${task.title}`}
          />
          <textarea
            placeholder="Task Title"
            value={task.title}
            onChange={handleTitleChange}
            className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent px-4 text-2xl font-semibold tracking-tight focus:outline-none"
          />
        </section>

        <SubtaskList
          className="z-40 mb-6"
          subtasks={task.subtasks || []}
          onSubtasksChange={(updatedSubtasks) => {
            const nonEmptySubtasks = updatedSubtasks.filter((s) => s.title.trim().length > 0);
            const completedNonEmptyCount = nonEmptySubtasks.filter((s) => s.isCompleted).length;
            const progress =
              nonEmptySubtasks.length > 0
                ? Math.round((completedNonEmptyCount / nonEmptySubtasks.length) * 100)
                : 0;

            updateTask(taskId, { subtasks: updatedSubtasks, progress });
            if (onEdit) onEdit({ ...task, subtasks: updatedSubtasks, progress });
          }}
        />

        <TaskNotes
          className="pl-7"
          initialContent={task.notes || ''}
          onContentChange={handleNotesChange}
        />
      </ScrollArea>
    </div>
  );
}
