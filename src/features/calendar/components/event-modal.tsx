import { cn } from '@/lib/utils';

import type { Event } from '@/lib/types';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { format } from 'date-fns';
import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete: (eventId: string) => void;
  event: Event | null;
  initialDate: Date | null;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('bg-[#1a73e8] text-white');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(event.start, 'yyyy-MM-dd'));
      setStartTime(format(event.start, 'HH:mm'));
      setEndDate(format(event.end, 'yyyy-MM-dd'));
      setEndTime(format(event.end, 'HH:mm'));
      setColor(event.color || 'bg-[#1a73e8] text-white');
      setCompleted(event.completed || false);
    } else if (initialDate) {
      const endDateTime = new Date(initialDate);
      endDateTime.setHours(endDateTime.getHours() + 1);

      setTitle('');
      setDescription('');
      setStartDate(format(initialDate, 'yyyy-MM-dd'));
      setStartTime(format(initialDate, 'HH:mm'));
      setEndDate(format(endDateTime, 'yyyy-MM-dd'));
      setEndTime(format(endDateTime, 'HH:mm'));
      setColor('bg-[#1a73e8] text-white');
      setCompleted(false);
    }
  }, [event, initialDate]);

  const handleSave = () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    onSave({
      id: event?.id || crypto.randomUUID(),
      title,
      description,
      start,
      end,
      color,
      completed,
    });
  };

  const colorOptions = [
    { value: 'bg-[#1a73e8] text-white', label: 'Blue' },
    { value: 'bg-[#d06102] text-white', label: 'Orange' },
    { value: 'bg-[#0b8043] text-white', label: 'Green' },
    { value: 'bg-[#8e24aa] text-white', label: 'Purple' },
    { value: 'bg-[#e67c73] text-white', label: 'Red' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-[#5f6368] bg-[#2d2e30] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-[#9aa0a6] hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]">
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent className="border-[#5f6368] bg-[#2d2e30] text-white">
                {colorOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={cn('my-1 rounded', option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-[#5f6368] bg-[#202124] text-white focus-visible:ring-[#8ab4f8]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
        </div>

        <div className="flex justify-between">
          {event && (
            <Button
              variant="destructive"
              onClick={() => onDelete(event.id)}
              className="bg-[#ea4335] hover:bg-[#d93025]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#5f6368] bg-transparent text-white hover:bg-[#3c4043]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#8ab4f8] text-[#202124] hover:bg-[#669df6]"
              disabled={!title}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
