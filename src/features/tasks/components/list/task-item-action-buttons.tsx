import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { ArrowRight, LucideFocus } from 'lucide-react';
import React from 'react';

interface TaskItemActionButtonsProps {
  isHovered: boolean;
  isCompleted: boolean;
  isFocused: boolean;
  onFocusClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDetailsClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TaskItemActionButtons = ({
  isHovered,
  isCompleted,
  isFocused,
  onFocusClick,
  onDetailsClick,
}: TaskItemActionButtonsProps) => {
  return (
    <div
      className={cn(
        'absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center opacity-0 transition-opacity duration-150',
        isHovered && 'opacity-100',
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
              onClick={onFocusClick}
              className={cn(
                'flex h-7 w-7 bg-transparent p-0 hover:bg-transparent',
                // Don't need hover opacity here, parent handles it
                // Keep hidden class for completed though, as a fallback/clarity
                isCompleted && 'hidden',
              )}
              aria-label="Focus Task"
              tabIndex={isHovered ? 0 : -1} // Make tabbable only when visible
            >
              <LucideFocus
                className={cn(
                  'ml-2 h-4 w-4 transition-all duration-200',
                  isFocused ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground',
                  'hover:scale-125 hover:fill-blue-500 hover:text-blue-500 hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]',
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-0.5 text-[10px] uppercase">
            <p>Focus (F)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDetailsClick}
              className="flex h-7 w-7 bg-transparent p-0 hover:bg-transparent"
              aria-label="Task Details"
              tabIndex={isHovered ? 0 : -1} // Make tabbable only when visible
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
