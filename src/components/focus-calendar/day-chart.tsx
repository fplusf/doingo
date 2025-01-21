import { format } from 'date-fns';
import { memo } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { cn } from '../../lib/utils';
import { ChartConfig, ChartContainer } from '../ui/chart';

export type DayChartProps = {
  progress: number;
  date: string;
  isSelected: boolean;
  isToday: boolean;
};

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#red',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig;

function DayChart({ date, progress, isSelected, isToday }: DayChartProps) {
  // Convert percentage string to number properly
  // const value = parseInt(progress.replace('%', ''));
  const data = [{ value: progress }]; // Simple array with value object

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
      <ChartContainer config={chartConfig} className={'h-16 w-full xl:h-20'}>
        <RadialBarChart
          width={100}
          height={100}
          data={data}
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background
            dataKey="value"
            data={[{ value: progress }]}
            cornerRadius={5}
            fill="hsl(var(--ring))"
          />
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn(
              'fill-gray-400 text-xs',
              isSelected && 'fill-white font-semibold',
              isToday && 'font-semibold',
            )}
          >
            {format(new Date(date), 'd')}
          </text>
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}

export default memo(DayChart);
