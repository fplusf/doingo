import { cn } from '@/lib/utils';
import React from 'react';

interface CategoryLineProps {
  label: string;
  color?: string;
  className?: string;
  isSticky?: boolean;
  id: string;
}

export const CategoryBadge: React.FC<CategoryLineProps> = ({
  label,
  color = '#3b82f6',
  className,
  isSticky = false,
  id,
}) => {
  const handleClick = () => {
    const element = document.getElementById(id);
    if (!element) return;

    // Find the scrollable container (ScrollArea component)
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    // Check if we should preserve scroll position
    const shouldPreserve = scrollContainer.getAttribute('data-preserve-scroll') === 'true';

    // Only scroll if we're not preserving scroll position from router
    if (!shouldPreserve) {
      // Calculate the scroll position
      const elementPosition = element.offsetTop - (element.parentElement?.offsetTop || 0);

      // Smooth scroll to the position
      scrollContainer.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className={cn(
        'text-centerjustify-between relative -left-3 flex w-20 scroll-mt-20 items-center rounded-md bg-sidebar py-1',
        isSticky && 'sticky top-0 z-30',
        className,
      )}
    >
      <h6 className="text-md mx-auto font-medium text-secondary-foreground">{label}</h6>
    </div>
  );
};
