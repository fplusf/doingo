'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ConnectorProps {
  progress: number;
  className?: string;
}

export function Connector({ progress, className }: ConnectorProps) {
  console.log('progress', progress);
  return (
    <div className={cn('relative h-full w-[2.5px]', className)}>
      <div
        className="absolute inset-0 rounded-full bg-gray-300"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
        }}
      />
      <Progress
        value={progress}
        isVertical
        indicatorClassName="bg-green-500"
        className="h-full w-full bg-transparent"
      />
    </div>
  );
}
