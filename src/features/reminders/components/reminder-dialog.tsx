import {
  addReminder,
  getListById,
  remindersStore,
  updateReminder,
} from '@/features/reminders/store/reminders.store';
import { Reminder } from '@/features/reminders/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: Reminder;
}

export const ReminderDialog = ({ open, onOpenChange, reminder }: ReminderDialogProps) => {
  const lists = useStore(remindersStore, (state) => state.lists);
  const selectedListId = useStore(remindersStore, (state) => state.selectedListId);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high' | 'none'>('none');
  const [list, setList] = React.useState(selectedListId || 'all');
  const [titleError, setTitleError] = React.useState(false);

  // Reset the form when the dialog opens/closes or when editing a different reminder
  React.useEffect(() => {
    if (open) {
      if (reminder) {
        // Edit mode
        setTitle(reminder.title);
        setDescription(reminder.description || '');
        setDueDate(reminder.dueDate ? new Date(reminder.dueDate) : undefined);
        setPriority(reminder.priority);
        setList(reminder.list);
      } else {
        // Add mode
        setTitle('');
        setDescription('');
        setDueDate(undefined);
        setPriority('none');
        setList(selectedListId || 'all');
      }
      setTitleError(false);
    }
  }, [open, reminder, selectedListId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    const reminderData = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? dueDate.getTime() : undefined,
      priority,
      list,
      completed: reminder ? reminder.completed : false,
    };

    if (reminder) {
      // Update existing reminder
      updateReminder(reminder.id, reminderData);
    } else {
      // Add new reminder
      addReminder(reminderData);
    }

    onOpenChange(false);
  };

  const selectedList = getListById(list);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{reminder ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(false);
                }}
                placeholder="Reminder title"
                className={cn(titleError && 'border-destructive')}
                autoFocus
              />
              {titleError && <p className="text-xs text-destructive">Title is required</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="due-date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="list">List</Label>
              <Select value={list} onValueChange={setList}>
                <SelectTrigger id="list">
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{reminder ? 'Save Changes' : 'Add Reminder'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
