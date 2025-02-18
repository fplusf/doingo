import { Hash, ClipboardList } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TaskScheduler } from '@/components/focus-calendar/task-scheduler';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiPicker } from '@/components/emoji/emoji-picker';
import { ScrollArea } from '../ui/scroll-area';
import { PrioritySelect } from '../priority/priority-select';
import { useTaskForm } from '@/hooks/use-task-form';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { DurationOption } from '../focus-calendar/duration-picker';
import { TaskCategory, TaskPriority } from '../../store/tasks.store';

export interface TaskFormValues {
  title: string;
  notes?: string;
  emoji?: string;
  startTime: string;
  endTime: string;
  duration: DurationOption;
  dueDate?: Date;
  priority: TaskPriority;
  category: TaskCategory;
}

interface TaskInputProps {
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export interface TaskInputRef {
  getFormValues: () => TaskFormValues;
}

const TaskInput = forwardRef<TaskInputRef, TaskInputProps>(
  ({ initialValues, onSubmit, onCancel, submitLabel = 'Add task', className }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
      values: { title, notes, emoji, startTime, endTime, duration, dueDate, priority, category },
      setters: { setTitle, setEmoji, setCategory, setPriority, setDueDate },
      handlers: { handleDurationChange, handleStartTimeChange, handleSubmit },
    } = useTaskForm({
      initialValues,
      onSubmit,
    });

    useImperativeHandle(ref, () => ({
      getFormValues: () => ({
        title,
        notes,
        emoji,
        startTime,
        endTime,
        duration,
        dueDate,
        priority,
        category,
      }),
    }));

    const adjustTextareaHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustTextareaHeight();
    }, [title]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(title.length, title.length);
      }
    }, [title]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    return (
      <div
        className={cn(
          'w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm',
          className,
        )}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="h-[150px]">
            <div className="flex items-start gap-2">
              <EmojiPicker emoji={emoji} onEmojiSelect={(newEmoji) => setEmoji(newEmoji)} />
              <Textarea
                ref={textareaRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Task description"
                className="resize-none border-none bg-transparent px-3 text-xl font-semibold outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </ScrollArea>

          <div className="flex items-center gap-1.5 border-t border-border pt-4">
            <TaskScheduler
              startTime={startTime}
              duration={duration}
              startDate={dueDate ? new Date(dueDate) : undefined}
              onStartTimeChange={handleStartTimeChange}
              onDurationChange={handleDurationChange}
              onStartDateChange={setDueDate}
              className="text-muted-foreground"
            />

            <div className="flex items-center gap-1">
              <Select value={category} onValueChange={(value: TaskCategory) => setCategory(value)}>
                <SelectTrigger className="h-8 w-[120px] px-2 text-sm">
                  <div className="flex items-center">
                    {category === 'work' && <Hash className="mr-1 h-3.5 w-3.5" />}
                    {(category === 'passion' || category === 'play') && (
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    )}
                    <SelectValue>
                      {category === 'work' ? 'Work' : category === 'passion' ? 'Passion' : 'Play'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">
                    <div className="flex items-center">
                      <Hash className="mr-1 h-3.5 w-3.5" />
                      Work
                    </div>
                  </SelectItem>
                  <SelectItem value="passion">
                    <div className="flex items-center">
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                      Passion
                    </div>
                  </SelectItem>
                  <SelectItem value="play">
                    <div className="flex items-center">
                      <ClipboardList className="mr-1 h-3.5 w-3.5" />
                      Play
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <PrioritySelect value={priority} onValueChange={setPriority} />
            </div>
          </div>
        </form>
      </div>
    );
  },
);

TaskInput.displayName = 'TaskInput';

export default TaskInput;
