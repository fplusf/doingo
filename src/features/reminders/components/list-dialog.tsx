import { addList, updateList } from '@/features/reminders/store/reminders.store';
import { ReminderList } from '@/features/reminders/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import * as React from 'react';

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: ReminderList;
}

// Predefined colors, similar to macOS Reminders
const listColors = [
  '#FF9500', // Orange
  '#FF2D55', // Red
  '#5856D6', // Purple
  '#007AFF', // Blue
  '#5AC8FA', // Light Blue
  '#4CD964', // Green
  '#FFCC00', // Yellow
  '#8E8E93', // Gray
];

export const ListDialog = ({ open, onOpenChange, list }: ListDialogProps) => {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(listColors[0]);
  const [nameError, setNameError] = React.useState(false);

  // Reset the form when the dialog opens/closes or when editing a different list
  React.useEffect(() => {
    if (open) {
      if (list) {
        // Edit mode
        setName(list.name);
        setColor(list.color);
      } else {
        // Add mode
        setName('');
        setColor(listColors[0]);
      }
      setNameError(false);
    }
  }, [open, list]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError(true);
      return;
    }

    const listData = {
      name: name.trim(),
      color,
    };

    if (list) {
      // Update existing list
      updateList(list.id, listData);
    } else {
      // Add new list
      addList(listData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{list ? 'Edit List' : 'New List'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="list-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                placeholder="List name"
                className={cn(nameError && 'border-destructive')}
                autoFocus
              />
              {nameError && <p className="text-xs text-destructive">Name is required</p>}
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {listColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      color === c ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{list ? 'Save Changes' : 'Create List'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
