import { TaskScheduler } from '@/components/focus-calendar/task-scheduler';
import { convertTaskToSchedulerProps } from '@/lib/task-utils';
import React from 'react';
import TaskNotes from './task-notes';
import { EmojiPicker } from '@/components/emoji/emoji-picker';
import { Task } from '@/store/tasks.store';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface TaskDocumentProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string;
}

export function TaskDocument({ task, onEdit, className }: TaskDocumentProps) {
  const [notes, setNotes] = React.useState(task.notes || '');
  const schedulerProps = React.useMemo(() => convertTaskToSchedulerProps(task), [task]);

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

  return (
    <div className={cn(className, 'flex h-full flex-col')}>
      {/* Schedule Information - Sticky Header */}
      <div className="z-8 sticky top-0 flex bg-background pb-6 pt-5">
        <div className="flex-1">
          <EmojiPicker emoji={task.emoji} onEmojiSelect={handleEmojiSelect} className="text-3xl" />
        </div>
        <TaskScheduler
          startTime={schedulerProps.startTime}
          duration={schedulerProps.duration}
          startDate={schedulerProps.startDate}
          className="flex-1 text-muted-foreground"
        />
      </div>

      <ScrollArea className="flex flex-1 items-start will-change-scroll">
        <section className="mb-2 border-b border-gray-700/40 pb-2">
          <textarea
            placeholder="Task Title"
            value={task.title}
            onChange={handleTitleChange}
            className="mb-2 w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent px-4 text-2xl font-semibold tracking-tight focus:outline-none"
            rows={3}
            style={{
              height: 'auto',
              minHeight: '2.5rem',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
            }}
            ref={(textareaRef) => {
              if (textareaRef) {
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
              }
            }}
          />
        </section>

        <TaskNotes notes={notes} onNotesChange={handleNotesChange} />
      </ScrollArea>
    </div>
  );
}
