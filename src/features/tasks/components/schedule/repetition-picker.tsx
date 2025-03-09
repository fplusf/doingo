import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export type RepetitionOption = 'once' | 'daily' | 'weekly' | 'custom';

interface RepetitionPickerProps {
  value: RepetitionOption;
  onChange: (value: RepetitionOption) => void;
}

export function RepetitionPicker({ value, onChange }: RepetitionPickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[100px] px-2 text-sm">
        <SelectValue>{value.charAt(0).toUpperCase() + value.slice(1)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="once">Once</SelectItem>
        <SelectItem value="daily">Daily</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="custom">Custom</SelectItem>
      </SelectContent>
    </Select>
  );
}
