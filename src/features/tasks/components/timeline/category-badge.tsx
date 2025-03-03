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
        'relative left-0 flex scroll-mt-20 items-center justify-center py-4',
        isSticky && 'sticky top-0 z-30',
        className,
      )}
    >
      <button
        onClick={handleClick}
        className="relative left-0 z-10 w-24 cursor-pointer rounded-full px-6 py-1 text-center text-sm font-medium opacity-100 transition-all hover:shadow-xl focus:outline-none active:scale-95"
        style={{
          backgroundColor: color,
          color: '#fff',
        }}
      >
        {label}
      </button>
    </div>
  );
};
