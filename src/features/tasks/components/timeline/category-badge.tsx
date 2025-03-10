import { cn } from '@/lib/utils';
import React from 'react';
import { TaskCategory } from '../../types';

interface CategoryLineProps {
  label: string;
  color?: string;
  className?: string;
  isSticky?: boolean;
  category: TaskCategory;
}

export const CategoryBadge: React.FC<CategoryLineProps> = ({
  label,
  color = '#3b82f6',
  className,
  isSticky = false,
  category,
}) => {
  console.log('category', category);
  return (
    <div
      className={cn(
        'relative left-14 flex w-20 scroll-mt-20 items-center justify-between rounded-md py-1 text-center',
        isSticky && 'top-0 z-30',
        className,
      )}
    >
      <h6
        className={cn(
          'text-md mx-auto font-medium',
          category === 'work' && 'text-red-300',
          category === 'passion' && 'text-blue-300',
          category === 'play' && 'text-green-300',
        )}
      >
        {label}
      </h6>
    </div>
  );
};
