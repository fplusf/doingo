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

interface DurationPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const durations = [
  '5 min',
  '10 min',
  '15 min',
  '20 min',
  '25 min',
  '30 min',
  '35 min',
  '40 min',
  '45 min',
  '50 min',
  '55 min',
  '1 hr',
  '2 hrs',
  '3 hrs',
  '4 hrs',
  '5 hrs',
  '6 hrs',
  '7 hrs',
  '8 hrs',
] as const;

// Extended type to include time format and placeholder
type Duration = (typeof durations)[number] | `${number}:${number}` | '--:--' | '';

// Helper function to convert duration to time format
const durationToTime = (duration: string): string => {
  if (duration.includes(':')) return duration;
  if (duration.includes('hr')) {
    const hours = parseInt(duration);
    return `0${hours}:00`.slice(-5);
  }
  const minutes = parseInt(duration);
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

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      // If it's a duration format, convert it to time
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

  // Handle defaultValue changes
  useEffect(() => {
    if (defaultValue && !isFocused) {
      const timeValue = durationToTime(defaultValue);
      setInputValue(timeValue);
      onChange(timeValue);
    }
  }, [defaultValue, onChange, isFocused]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Only allow if hours are 0-9
    if (newValue.length >= 2) {
      const hours = parseInt(newValue.substring(0, 2));
      if (hours > 9) {
        return;
      }
    }

    setInputValue(newValue);

    // Handle empty or partial values
    if (!newValue || newValue === '') {
      onChange('');
      return;
    }

    // If only hours are entered (format: "HH:")
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

    onChange(finalValue);
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
  onSelect: (duration: Duration) => void;
  value?: string;
  onClose: () => void;
}) => {
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string | undefined>(value);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Update selectedDuration when value changes externally
  useEffect(() => {
    setSelectedDuration(value);
  }, [value]);

  useEffect(() => {
    // When the list is shown and there's a selected item, scroll it into view
    if (!isCustomTime && selectedRef.current) {
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }, [isCustomTime]);

  const handleCustomTimeChange = (timeString: string) => {
    // Update both the selected duration and the value
    setSelectedDuration(timeString);
    onSelect(timeString as Duration);
  };

  const handleFocus = () => {
    setIsCustomTime(true);
  };

  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
    onSelect(duration as Duration);
    onClose();
  };

  // Helper function to check if a duration matches the current value
  const isDurationSelected = (duration: string) => {
    if (!selectedDuration) return false;
    if (selectedDuration === duration) return true;
    // Also check if the time format matches the duration
    if (selectedDuration.includes(':')) {
      const timeValue = durationToTime(duration);
      return timeValue === selectedDuration;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b p-2">
        <TimeInput
          value={selectedDuration}
          onChange={handleCustomTimeChange}
          onFocus={handleFocus}
          defaultValue={selectedDuration}
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
                  key={duration}
                  ref={isSelected ? selectedRef : null}
                  variant="ghost"
                  className={cn(
                    'relative w-full justify-start rounded-sm px-2 py-1.5 text-sm font-normal hover:bg-muted',
                  )}
                  onClick={() => handleDurationSelect(duration)}
                >
                  {duration}
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

  const handleSelect = (duration: Duration) => {
    onValueChange?.(duration);
  };

  const handleClose = () => {
    console.log('close duration picker');
    setOpen(false);
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
        <TimePickerList onSelect={handleSelect} value={value} onClose={handleClose} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
