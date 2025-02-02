import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';

interface EmojiPickerProps {
  emoji?: string;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ emoji, onEmojiSelect, className }: EmojiPickerProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  return (
    <Popover modal={true} open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 rounded-full p-0',
            emoji ? 'bg-accent/15 hover:bg-accent/25' : 'hover:bg-accent/25',
            className,
          )}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-none p-0"
        align="start"
        side="bottom"
        style={{ height: '350px', overflow: 'auto' }}
      >
        <div onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              onEmojiSelect(emoji.native);
              setIsEmojiPickerOpen(false);
            }}
            theme={useTheme().theme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="none"
            scrollable={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
