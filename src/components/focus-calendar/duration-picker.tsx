import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CornerDownLeft, Check } from 'lucide-react';

interface DurationOption {
  label: string;
  minutes: number;
}

export const durations: DurationOption[] = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '25 min', minutes: 25 },
  { label: '30 min', minutes: 30 },
  { label: '35 min', minutes: 35 },
  { label: '40 min', minutes: 40 },
  { label: '45 min', minutes: 45 },
  { label: '50 min', minutes: 50 },
  { label: '55 min', minutes: 55 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hrs', minutes: 120 },
  { label: '3 hrs', minutes: 180 },
  { label: '4 hrs', minutes: 240 },
  { label: '5 hrs', minutes: 300 },
  { label: '6 hrs', minutes: 360 },
  { label: '7 hrs', minutes: 420 },
  { label: '8 hrs', minutes: 480 },
];

export type { DurationOption };

interface DurationPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Helper function to convert minutes to duration label
const minutesToDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
};

// Helper function to parse duration string to minutes
const parseDuration = (duration: string): number => {
  if (duration.includes('hr')) {
    const hours = parseFloat(duration);
    return hours * 60;
  }
  return parseInt(duration);
};

// Helper function to convert duration to time format
const durationToTime = (duration: string): string => {
  if (duration.includes(':')) return duration;
  const minutes = parseDuration(duration);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const TimeInput = ({
  value,
  onChange,
  onFocus,
  defaultValue,
  onClose,
}: {
  value?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  defaultValue?: string;
  onClose: () => void;
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      if (!value.includes(':')) {
        const timeValue = durationToTime(value);
        setInputValue(timeValue);
      } else {
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (defaultValue && !isFocused) {
      const timeValue = durationToTime(defaultValue);
      setInputValue(timeValue);
      onChange(timeValue);
    }
  }, [defaultValue, onChange, isFocused]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue.length >= 2) {
      const hours = parseInt(newValue.substring(0, 2));
      if (hours > 9) return;
    }

    setInputValue(newValue);

    if (!newValue || newValue === '') {
      onChange('');
      return;
    }

    if (newValue.endsWith(':')) {
      const hours = newValue.slice(0, -1);
      if (hours) {
        onChange(`${hours}:00`);
      }
      return;
    }

    onChange(newValue);
  };

  const handleSave = () => {
    let finalValue = '';
    if (!inputValue || inputValue === '') {
      finalValue = '--:--';
    } else if (!inputValue.includes(':')) {
      finalValue = `${inputValue}:00`;
    } else {
      finalValue = inputValue;
    }

    // Convert time format to duration format
    const [hours, minutes] = finalValue.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const durationLabel = minutesToDuration(totalMinutes);

    onChange(durationLabel);
    setIsFocused(false);
    onClose();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        type="time"
        value={inputValue}
        onChange={handleTimeChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-inner-spin-button]:hidden"
        placeholder="--:--"
      />
      {isFocused && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-full gap-1.5 text-[11px] font-normal text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          onClick={handleSave}
        >
          <CornerDownLeft className="h-3 w-3" />
          Return to save
        </Button>
      )}
    </div>
  );
};

const TimePickerList = ({
  onSelect,
  value,
  onClose,
}: {
  onSelect: (duration: string) => void;
  value?: string;
  onClose: () => void;
}) => {
  const [isCustomTime, setIsCustomTime] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCustomTime && selectedRef.current) {
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }, [isCustomTime]);

  const handleCustomTimeChange = (timeString: string) => {
    onSelect(timeString);
    // Don't close the menu for custom time changes until the user explicitly saves
  };

  const handleFocus = () => {
    setIsCustomTime(true);
  };

  const handleDurationSelect = (duration: DurationOption) => {
    onSelect(duration.label);
    onClose(); // Close the menu after selection
  };

  const isDurationSelected = (duration: DurationOption) => {
    if (!value) return false;
    if (value === duration.label) return true;
    if (value.includes(':')) {
      const timeValue = durationToTime(duration.label);
      return timeValue === value;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b p-2">
        <TimeInput
          value={value}
          onChange={handleCustomTimeChange}
          onFocus={handleFocus}
          defaultValue={value}
          onClose={onClose}
        />
      </div>
      {!isCustomTime && (
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {durations.map((duration) => {
              const isSelected = isDurationSelected(duration);
              return (
                <Button
                  key={duration.label}
                  ref={isSelected ? selectedRef : null}
                  variant="ghost"
                  className={cn(
                    'relative w-full justify-start rounded-sm px-2 py-1.5 text-sm font-normal hover:bg-muted',
                    isSelected && 'bg-accent',
                  )}
                  onClick={() => handleDurationSelect(duration)}
                >
                  {duration.label}
                  {isSelected && <Check className="absolute right-2 h-4 w-4 text-primary" />}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export function DurationPicker({ value, onValueChange, className }: DurationPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (duration: string) => {
    onValueChange?.(duration);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-[120px]', className)}
          aria-label="Select duration"
        >
          {value || 'Duration'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] bg-popover p-0" sideOffset={4}>
        <TimePickerList onSelect={handleSelect} value={value} onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
