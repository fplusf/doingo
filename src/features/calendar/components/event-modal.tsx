import { addMinutes, format } from 'date-fns';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Event } from '@/lib/types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  event?: Event | null;
  initialDate?: Date | null;
}

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
}: EventModalProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(event?.start || initialDate || new Date());
  const [endDate, setEndDate] = useState(
    event?.end || (initialDate ? addMinutes(initialDate, 30) : addMinutes(new Date(), 30)),
  );
  const [color, setColor] = useState(event?.color || 'blue');

  useEffect(() => {
    if (isOpen) {
      setTitle(event?.title || '');
      setDescription(event?.description || '');
      setStartDate(event?.start || initialDate || new Date());
      setEndDate(
        event?.end || (initialDate ? addMinutes(initialDate, 30) : addMinutes(new Date(), 30)),
      );
      setColor(event?.color || 'blue');
    }
  }, [isOpen, event, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: event?.id || '',
      title,
      description,
      start: startDate,
      end: endDate,
      color,
      completed: event?.completed || false,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#3c4043] bg-[#202124] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{event ? 'Edit Event' : 'Create Event'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[#3c4043] bg-[#2d2e30] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-[#3c4043] bg-[#2d2e30] text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={format(startDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="border-[#3c4043] bg-[#2d2e30] text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={format(endDate, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="border-[#3c4043] bg-[#2d2e30] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <RadioGroup value={color} onValueChange={setColor} className="flex gap-4">
              {colorOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="border-2 border-white/20"
                  />
                  <Label htmlFor={option.value} className="flex cursor-pointer items-center gap-2">
                    <div className={`h-4 w-4 rounded-full ${option.class}`} />
                    <span>{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(event.id)}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#5f6368] bg-transparent text-white hover:bg-[#3c4043]"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#8ab4f8] text-[#202124] hover:bg-[#8ab4f8]/90">
              {event ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
