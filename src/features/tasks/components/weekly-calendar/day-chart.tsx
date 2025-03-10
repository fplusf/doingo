import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer } from '@/shared/components/ui/chart';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { PolarAngleAxis, PolarGrid, RadialBar, RadialBarChart } from 'recharts';

export type DayChartProps = {
  progress: number;
  date: string;
  isSelected: boolean;
  isToday: boolean;
};

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#60a5fa',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig;

export function DayChart({ date, progress, isSelected, isToday }: DayChartProps) {
  const data = [{ value: progress }];
  const [showAnimation, setShowAnimation] = useState(false);
  const [prevProgress, setPrevProgress] = useState(progress);

  // Trigger animation when progress reaches 100
  useEffect(() => {
    if (progress === 100 && prevProgress !== 100) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2500);
      return () => clearTimeout(timer);
    }
    setPrevProgress(progress);
  }, [progress, prevProgress]);

  return (
    <div className="flex w-full cursor-pointer flex-col items-center">
      <div
        className={cn(
          'text-center text-xs font-light text-gray-400/90',
          isSelected && 'font-semibold text-white',
          isToday && 'text-green-600',
        )}
      >
        {format(new Date(date), 'EEE')}
      </div>

      <div className="relative">
        <ChartContainer config={chartConfig} className={'h-16 w-full'}>
          <RadialBarChart
            width={100}
            height={100}
            data={data}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            {isSelected && (
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[20, 0]}
              />
            )}
            <RadialBar
              background
              dataKey="value"
              data={[{ value: progress }]}
              cornerRadius={5}
              fill="hsl(var(--ring))"
              className={showAnimation ? 'animate-pulse' : ''}
            />
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            {isSelected && <circle cx="50%" cy="50%" r="14" className="fill-blue-500" />}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn(
                'fill-gray-400 text-sm',
                isSelected && 'fill-white font-semibold',
                isToday && 'font-semibold',
                showAnimation && 'animate-double-jump fill-green-500',
              )}
            >
              {format(new Date(date), 'd')}
            </text>
          </RadialBarChart>
        </ChartContainer>

        {/* Celebration animation elements */}
        {showAnimation && (
          <div className="pointer-events-none absolute inset-0">
            {/* Center burst effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute h-16 w-16 animate-ping rounded-full bg-green-500 opacity-20"></div>
              <div className="animation-delay-100 absolute h-12 w-12 animate-ping rounded-full bg-green-400 opacity-10"></div>

              {/* Particle effects */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-green-500"
                  style={{
                    animation: `particle-burst 1.8s ease-in-out forwards`,
                    transform: `rotate(${i * 30}deg)`,
                    transformOrigin: 'center',
                    opacity: 0,
                    animationDelay: `${i * 20}ms`,
                  }}
                />
              ))}

              {/* Hearts or stars (optional) */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={`heart-${i}`}
                  className="absolute text-xs text-green-500"
                  style={{
                    animation: `float-up 2s ease-in-out forwards`,
                    left: `${40 + Math.random() * 20}%`,
                    top: `${40 + Math.random() * 20}%`,
                    opacity: 0,
                    animationDelay: `${i * 150}ms`,
                  }}
                >
                  ★
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
