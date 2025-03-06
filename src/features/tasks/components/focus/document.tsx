import { EmojiPicker } from '@/features/tasks/components/schedule/emoji-picker';
import { OptimalTask, Subtask } from '@/features/tasks/types';
import { convertTaskToSchedulerProps } from '@/lib/task-utils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import React from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { TaskScheduler } from '../schedule/task-scheduler';
import TaskNotes from './notes';
import { SubtaskList } from './subtasks';

interface TaskDocumentProps {
  task: OptimalTask;
  onEdit: (task: OptimalTask) => void;
  className?: string;
}

export function TaskDocument({ task, onEdit, className }: TaskDocumentProps) {
  const [notes, setNotes] = React.useState(task.notes || '');
  const schedulerProps = React.useMemo(() => convertTaskToSchedulerProps(task), [task]);
  // Store previous subtask states to restore when uncompleting a task
  const previousSubtaskStatesRef = React.useRef<Subtask[] | null>(null);

  const handleNotesChange = React.useCallback(
    (content: string) => {
      setNotes(content);
      onEdit({ ...task, notes: content });
    },
    [task, onEdit],
  );

  const handleTitleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onEdit({ ...task, title: e.target.value });
    },
    [task, onEdit],
  );

  const handleEmojiSelect = React.useCallback(
    (emoji: string) => {
      onEdit({ ...task, emoji });
    },
    [task, onEdit],
  );

  const handleTaskCompletedChange = React.useCallback(
    (completed: boolean) => {
      // If there are no subtasks, just update the main task
      if (!task.subtasks || task.subtasks.length === 0) {
        onEdit({ ...task, completed });
        return;
      }

      if (completed) {
        // Store current subtask states before completing all
        previousSubtaskStatesRef.current = [...(task.subtasks || [])];

        // Complete all subtasks
        const updatedSubtasks = task.subtasks.map((subtask) => ({
          ...subtask,
          isCompleted: true,
        }));

        // Calculate progress (should be 100% since all are completed)
        const progress = 100;

        // Update the task with completed subtasks
        onEdit({
          ...task,
          completed,
          subtasks: updatedSubtasks,
          progress,
        });
      } else {
        // Restore previous subtask states if available
        if (previousSubtaskStatesRef.current) {
          // Calculate progress percentage based on restored states
          const completedCount = previousSubtaskStatesRef.current.filter(
            (subtask) => subtask.isCompleted,
          ).length;
          const progress =
            previousSubtaskStatesRef.current.length > 0
              ? Math.round((completedCount / previousSubtaskStatesRef.current.length) * 100)
              : 0;

          // Update the task with restored subtask states
          onEdit({
            ...task,
            completed,
            subtasks: previousSubtaskStatesRef.current,
            progress,
          });

          // Clear the reference after restoring
          previousSubtaskStatesRef.current = null;
        } else {
          // If no previous states are stored (edge case), just update completion status
          onEdit({ ...task, completed });
        }
      }
    },
    [task, onEdit],
  );

  const handleSubtasksChange = React.useCallback(
    (subtasks: Subtask[]) => {
      // Calculate progress percentage
      const completedCount = subtasks.filter((subtask) => subtask.isCompleted).length;
      const progress =
        subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

      onEdit({ ...task, subtasks, progress });
    },
    [task, onEdit],
  );

  return (
    <div className={cn(className, 'flex h-full flex-col')}>
      {/* Schedule Information - Sticky Header */}
      <div className="z-8 sticky top-0 flex bg-background pb-6 pt-5">
        <div className="flex-1">
          <EmojiPicker emoji={task.emoji} onEmojiSelect={handleEmojiSelect} className="text-3xl" />
        </div>
        <TaskScheduler
          startTime={schedulerProps.startTime}
          startDate={schedulerProps.startDate}
          endTime={schedulerProps.endTime}
          endDate={schedulerProps.endDate}
          className="flex-1 text-muted-foreground"
        />
      </div>

      <ScrollArea
        className="flex flex-1 items-start will-change-scroll"
        preserveScrollPosition={true}
      >
        <section className="mb-2 flex items-center justify-between border-b border-gray-700/40 pb-2">
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
            rows={3}
            style={{
              height: 'auto',
              minHeight: '2.5rem',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
            }}
            ref={(textareaRef) => {
              if (textareaRef) {
                const scrollContainer = textareaRef.closest('.scroll-area-viewport');
                const scrollTop = scrollContainer?.scrollTop;

                // Reset height first to get accurate scrollHeight
                textareaRef.style.height = '2.5rem';
                const scrollHeight = textareaRef.scrollHeight;

                // Only update if scrollHeight is reasonable (prevent excessive growth)
                if (scrollHeight <= 300) {
                  textareaRef.style.height = `${scrollHeight}px`;
                } else {
                  textareaRef.style.height = '300px';
                  textareaRef.style.overflowY = 'auto';
                }

                // Restore scroll position
                // if (scrollContainer && scrollTop) {
                //   scrollContainer.scrollTop = scrollTop;
                // }
              }
            }}
          />
        </section>

        {/* Subtasks Section */}
        <section className="mb-2 border-b border-gray-700/40 pb-2">
          <SubtaskList subtasks={task.subtasks || []} onSubtasksChange={handleSubtasksChange} />
        </section>

        <TaskNotes notes={notes} onNotesChange={handleNotesChange} />
      </ScrollArea>
    </div>
  );
}
