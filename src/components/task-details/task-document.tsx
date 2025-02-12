import { TaskScheduler } from '@/components/focus-calendar/task-scheduler';
import { convertTaskToSchedulerProps } from '@/lib/task-utils';
import React from 'react';
import TaskNotes from './task-notes';
import { EmojiPicker } from '@/components/emoji/emoji-picker';
import { Task } from '@/store/tasks.store';

interface TaskDocumentProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string;
}

export function TaskDocument({ task, onEdit, className }: TaskDocumentProps) {
  const [notes, setNotes] = React.useState(task.notes || '');
  const schedulerProps = convertTaskToSchedulerProps(task);

  return (
    <div className={className}>
      {/* Schedule Information */}
      <div className="mb-6 flex">
        <div className="flex-1">
          <EmojiPicker
            emoji={task.emoji}
            onEmojiSelect={(emoji) => onEdit({ ...task, emoji })}
            className="text-3xl"
          />
        </div>
        <TaskScheduler
          startTime={schedulerProps.startTime}
          duration={schedulerProps.duration}
          startDate={schedulerProps.startDate}
          className="flex-1 text-muted-foreground"
        />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <textarea
          placeholder="Task Title"
          value={task.title}
          onChange={(e) => {
            onEdit({ ...task, title: e.target.value });
          }}
          className="mb-2 w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold tracking-tight focus:outline-none"
          rows={1}
          style={{ height: 'auto', minHeight: '2.5rem' }}
          ref={(textareaRef) => {
            if (textareaRef) {
              textareaRef.style.height = '2.5rem';
              textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
            }
          }}
        />
      </div>

      {/* Notes */}
      <TaskNotes
        notes={notes}
        onNotesChange={(content) => {
          setNotes(content);
          onEdit({ ...task, notes: content });
        }}
      />
    </div>
  );
}
