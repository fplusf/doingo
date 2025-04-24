import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Repeat } from 'lucide-react';
import { useState } from 'react';
import { RepetitionType } from '../../types';
import { DateTimePicker } from './date-time-picker';

interface RepetitionPickerProps {
  frequency: RepetitionType;
  onFrequencyChange: (value: RepetitionType) => void;
  repeatInterval: number;
  onRepeatIntervalChange: (interval: number) => void;
  repeatStartDate?: Date;
  onRepeatStartDateChange: (date: Date | undefined) => void;
  repeatEndDate?: Date;
  onRepeatEndDateChange: (date: Date | undefined) => void;
}

export function RepetitionPicker({
  frequency,
  onFrequencyChange,
  repeatInterval,
  onRepeatIntervalChange,
  repeatStartDate,
  onRepeatStartDateChange,
  repeatEndDate,
  onRepeatEndDateChange,
}: RepetitionPickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onRepeatIntervalChange(value);
    } else if (event.target.value === '') {
      onRepeatIntervalChange(1);
    }
  };

  const handleStartDateChange = (date: Date, _time: string) => {
    onRepeatStartDateChange(date);
  };

  const handleEndDateChange = (date: Date, _time: string) => {
    onRepeatEndDateChange(date);
  };

  const getFrequencyLabel = (value: RepetitionType): string => {
    switch (value) {
      case 'once':
        return 'Once';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return '';
    }
  };

  const getIntervalUnitLabel = (value: RepetitionType, singular: boolean = false): string => {
    switch (value) {
      case 'daily':
        return singular ? 'day' : `day${repeatInterval > 1 ? 's' : ''}`;
      case 'weekly':
        return singular ? 'week' : `week${repeatInterval > 1 ? 's' : ''}`;
      case 'monthly':
        return singular ? 'month' : `month${repeatInterval > 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-28 justify-start px-2 text-sm">
          <Repeat className="mr-1.5 h-3.5 w-3.5" />
          <span className="truncate">{getFrequencyLabel(frequency)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex w-32 flex-col space-y-3">
          {/* Frequency Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground/60">Repeats</span>
            <Select value={frequency} onValueChange={onFrequencyChange}>
              <SelectTrigger className="h-7 w-full px-2 text-xs">
                <SelectValue placeholder="Repeats">{getFrequencyLabel(frequency)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency !== 'once' && (
            <>
              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-foreground/60">Starts</span>
                <DateTimePicker
                  date={repeatStartDate}
                  onChange={handleStartDateChange}
                  className="w-full text-xs"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-foreground/60">Ends</span>
                <DateTimePicker
                  date={repeatEndDate}
                  onChange={handleEndDateChange}
                  className="w-full text-xs"
                />
              </div>

              {/* Repeat Interval Section */}
              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-foreground/60">Repeat every</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={repeatInterval}
                    onChange={handleIntervalChange}
                    className="h-7 w-[60px] px-2 text-xs"
                    aria-label="Repeat interval"
                  />
                  <span className="text-xs text-foreground/60">
                    {getIntervalUnitLabel(frequency)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
