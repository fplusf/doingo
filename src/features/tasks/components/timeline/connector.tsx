import { cn } from '@/lib/utils';
import { Progress } from '@/shared/components/ui/progress';

interface ConnectorProps {
  progress: number;
  className?: string;
}

export function Connector({ progress, className }: ConnectorProps) {
  return (
    <div className={cn('relative h-full w-[2.5px]', className)}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 4px, #767a81 4px, #767a81 8px)',
        }}
      />
      <Progress
        value={progress}
        isVertical
        indicatorClassName="bg-green-500 transition-all duration-500"
        className="h-full w-full bg-transparent"
      />
    </div>
  );
}
