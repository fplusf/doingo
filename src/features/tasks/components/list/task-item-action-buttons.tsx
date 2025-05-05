import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { ArrowRight, Pin } from 'lucide-react';
import React from 'react';

interface TaskItemActionButtonsProps {
  isHovered: boolean;
  isCompleted: boolean;
  isFocused: boolean;
  onPinClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onFocusClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TaskItemActionButtons = ({
  isHovered,
  isCompleted,
  isFocused,
  onPinClick,
  onFocusClick,
}: TaskItemActionButtonsProps) => {
  return (
    <div
      className={cn(
        'absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center opacity-0 transition-opacity duration-150',
        isHovered && 'opacity-100',
        isFocused && 'opacity-100',
        isCompleted && 'hidden', // Hide buttons if task is completed
      )}
      // Prevent click events from bubbling up to the parent card
      onClick={(e) => e.stopPropagation()}
      // Prevent focus propagation when tabbing
      onFocus={(e) => e.stopPropagation()}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPinClick}
              className={cn(
                'flex h-7 w-7 bg-transparent p-0 hover:bg-transparent',
                // Don't need hover opacity here, parent handles it
                // Keep hidden class for completed though, as a fallback/clarity
                isCompleted && 'hidden',
              )}
              aria-label="Bring to Now"
              tabIndex={isHovered ? 0 : -1} // Make tabbable only when visible
            >
              <Pin
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-all duration-200 hover:scale-110 hover:text-blue-500 hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]',
                  isFocused && 'fill-blue-500 text-blue-500',
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-0.5 text-[10px] uppercase">
            <p>Work now(NN)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFocusClick}
              className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
              aria-label="Task Details"
              tabIndex={isHovered ? 0 : -1} // Make tabbable only when visible
            >
              <ArrowRight
                className={cn(
                  'ml-0.5 h-4 w-4 transition-all duration-200',
                  isFocused ? 'text-blue-500' : 'text-muted-foreground',
                  'hover:scale-125 hover:text-blue-500',
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-0.5 text-[10px] uppercase">
            <p>Details (D)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
