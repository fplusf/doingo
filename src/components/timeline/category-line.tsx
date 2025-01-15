import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryLineProps {
  label: string;
  color?: string;
  className?: string;
  isSticky?: boolean;
  id: string;
}

export const CategoryLine: React.FC<CategoryLineProps> = ({
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

    // Calculate the scroll position
    const elementPosition = element.offsetTop - (element.parentElement?.offsetTop || 0);

    // Smooth scroll to the position
    scrollContainer.scrollTo({
      top: elementPosition,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={cn(
        'relative -mx-10 flex scroll-mt-20 items-center justify-center py-4 opacity-90',
        'bg-gradient-to-b from-background via-background to-transparent',
        isSticky && 'sticky top-0 z-30',
        className,
      )}
    >
      <div className="absolute flex w-1/2 items-center justify-center">
        <div
          className="h-[2px] w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${color} 20%, ${color} 80%, transparent)`,
          }}
        />
      </div>
      <button
        onClick={handleClick}
        className="relative z-10 w-32 cursor-pointer rounded-full px-6 py-1 text-center text-sm font-medium opacity-100 transition-all hover:shadow-md focus:outline-none active:scale-95"
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
