import { OptimalTask } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import React, { useCallback, useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';
import { updateCompletionStatus } from '../../stores/task-form.store';
import { toggleTaskCompletion, updateTask, updateTaskBreak } from '../../stores/tasks.store';
import CollapsedContainer from '../schedule/collapsed-container';
import { EmojiPicker } from '../schedule/emoji-picker';
import { TaskScheduler } from '../schedule/task-scheduler';
import { TimelineNode } from '../timeline/timeline-node';
import { PomodoroTimer } from '../timer/pomodoro-timer';
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
  const [isEmojiPickerVisibleAndOpen, setIsEmojiPickerVisibleAndOpen] = useState(false);

  // Sync task completion status with the form
  useEffect(() => {
    // Update the form state when the task's completion status changes
    updateCompletionStatus(task.completed);
  }, [task.completed, taskId]);

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
    (selectedEmoji: string) => {
      updateTask(taskId, { emoji: selectedEmoji });
      // Call onEdit for backward compatibility if provided
      if (onEdit) onEdit({ ...task, emoji: selectedEmoji });
      setIsEmojiPickerVisibleAndOpen(false); // Close picker after selection
    },
    [taskId, task, onEdit],
  );

  // Handler for toggling task completion
  const handleTaskCompletedChange = useCallback(
    (completed: boolean) => {
      toggleTaskCompletion(taskId);
      // Also update the form store to stay in sync
      updateCompletionStatus(!task.completed);
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

  // Handler for adding breaks
  const handleAddBreak = useCallback(
    (taskId: string, startTime: Date, duration: number, breakType: 'during' | 'after') => {
      updateTaskBreak(taskId, startTime, duration, breakType);
      if (onEdit) {
        onEdit({
          ...task,
          break: {
            startTime,
            duration,
            type: breakType,
          },
        });
      }
    },
    [task, onEdit],
  );

  const handleTimelineNodeClick = () => {
    setIsEmojiPickerVisibleAndOpen(true);
  };

  return (
    <div className={cn(className, 'flex h-full flex-col')}>
      {/* Schedule Information - Sticky Header */}
      <div className="z-8 sticky top-0 flex bg-background pb-6 pl-3 pt-5">
        <div className="flex-1">
          <div
            className="relative flex h-12 w-12 cursor-pointer items-center justify-center"
            onClick={handleTimelineNodeClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTimelineNodeClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Change task emoji"
          >
            <TimelineNode
              emoji={task.emoji || '📝'}
              priority={task.priority}
              completed={task.completed}
              startTime={task.startTime}
              duration={task.duration}
              timeSpent={task.timeSpent}
              isDetailsView={true}
              className="pointer-events-none h-12 w-12" // Make node visual only for this interaction
            />
            {isEmojiPickerVisibleAndOpen && (
              // This div ensures the EmojiPicker's trigger is layered correctly if needed,
              // though EmojiPicker itself is a Popover with its own trigger.
              // The key is isOpenControlled tells EmojiPicker to show its popover.
              <div className="absolute inset-0">
                <EmojiPicker
                  emoji={task.emoji || ''}
                  onEmojiSelect={handleEmojiSelect}
                  className="h-full w-full rounded-3xl bg-transparent" // Trigger styled to be transparent
                  isOpenControlled={isEmojiPickerVisibleAndOpen}
                  onOpenChangeControlled={setIsEmojiPickerVisibleAndOpen}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-black/10 p-1 px-2">
          <CollapsedContainer>
            <TaskScheduler className="flex-1 text-muted-foreground" taskId={taskId} />
          </CollapsedContainer>
          {/* TODO: add back after launch & idea validtion*/}
          {/* <TaskTimer taskId={taskId} initialTimeSpent={task.timeSpent || 0} editable={true} /> */}
        </div>
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
          <div className="flex flex-1 justify-between gap-4">
            <TextareaAutosize
              placeholder="Task Title"
              value={task.title}
              onChange={handleTitleChange}
              className="w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent px-4 text-2xl font-semibold tracking-tight focus:outline-none"
              minRows={1}
            />
            <PomodoroTimer
              className="flex-shrink-0"
              taskId={taskId}
              onAddBreak={handleAddBreak}
              totalDuration={task.duration || 45 * 60 * 1000} // Default 45 minutes if no duration set
            />
          </div>
        </section>

        <SubtaskList
          className="z-40 mb-10"
          isDetailsPage={true}
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
