import { cn } from '@/lib/utils';

interface ConnectorProps {
  className?: string;
  dashed?: boolean;
}

export function Connector({ className, dashed = false }: ConnectorProps) {
  return (
    <div
      className={cn('relative h-full w-[2px]', dashed ? 'opacity-60' : 'bg-gray-600/40', className)}
      style={
        dashed
          ? {
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 4px, #767a81 4px, #767a81 8px)',
              backgroundSize: '2px 12px',
            }
          : undefined
      }
    />
  );
}
