import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Smile } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface EmojiPickerProps {
  emoji?: string;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  isOpenControlled?: boolean;
  onOpenChangeControlled?: (open: boolean) => void;
}

export function EmojiPicker({
  emoji,
  onEmojiSelect,
  className,
  isOpenControlled,
  onOpenChangeControlled,
}: EmojiPickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = isOpenControlled !== undefined && onOpenChangeControlled !== undefined;

  const isOpen = isControlled ? isOpenControlled : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChangeControlled(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const shadowRoot = document.querySelector('em-emoji-picker')?.shadowRoot;
      if (shadowRoot) {
        setTimeout(() => {
          const searchInput = shadowRoot.querySelector(
            '.search input[type="search"]',
          ) as HTMLInputElement;
          searchInput?.focus({ preventScroll: true });
        }, 100);
      }
    }
  }, [isOpen]);

  return (
    <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-full w-10 shrink-0 rounded-full p-0',
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
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
          <Picker
            key={isOpen ? 'open' : 'closed'}
            data={data}
            onEmojiSelect={(selectedEmoji: any) => {
              onEmojiSelect(selectedEmoji.native);
              setIsOpen(false);
            }}
            theme={useTheme().theme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="none"
            autoFocus={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
