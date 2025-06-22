import { tasksStore } from '@/features/tasks/stores/tasks.store';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/components/ui/chart';
import { useStore } from '@tanstack/react-store';
import { addDays, format, startOfWeek } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const StatsOverview: React.FC = () => {
  // Get tasks from store
  const tasks = useStore(tasksStore, (state) => state.tasks);

  // Prepare data for weekly pending vs completed tasks chart
  const weeklyTaskChartData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const data = [] as { day: string; pending: number; completed: number }[];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((task) => task.taskDate === dateStr);
      const completedCount = dayTasks.filter((task) => task.completed).length;
      const pendingCount = dayTasks.length - completedCount;

      data.push({
        day: format(currentDate, 'EEEE'),
        pending: pendingCount,
        completed: completedCount,
      });
    }

    return data;
  }, [tasks]);

  // Chart color & label configuration
  const taskChartConfig: ChartConfig = {
    pending: {
      label: 'Total',
      color: '#3b82f6', // blue
    },
    completed: {
      label: 'Done',
      color: '#22c55e', // green
    },
  };

  // Calculate weekly planned vs actual time (in hours)
  const weeklyTimeStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((task) => task.taskDate === dateStr);
      // Planned time: sum of durations (ms) for all tasks that day
      const plannedMs = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
      // Actual time: sum of timeSpent (ms) for all tasks that day
      const actualMs = dayTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
      weekData.push({
        name: format(currentDate, 'EEE'),
        planned: +(plannedMs / 3600000).toFixed(2), // hours
        actual: +(actualMs / 3600000).toFixed(2), // hours
      });
    }
    return weekData;
  }, [tasks]);

  const timeChartConfig = {
    planned: {
      label: 'Planned',
      color: '#3b82f6', // blue
    },
    actual: {
      label: 'Actual',
      color: '#22c55e', // green
    },
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Statistics Overview</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Task Progress (pending vs completed) */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Progress</CardTitle>
            <CardDescription>Tasks pending vs completed by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={taskChartConfig}>
              <BarChart
                accessibilityLayer
                data={weeklyTaskChartData}
                height={300}
                barGap={8}
                barCategoryGap={24}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => (value as string).slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  defaultIndex={0}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const pending = payload.find((p) => p.dataKey === 'pending')?.value || 0;
                      const completed = payload.find((p) => p.dataKey === 'completed')?.value || 0;
                      const total = (pending as number) + (completed as number);

                      return (
                        <div className="rounded-lg border bg-background p-2 text-xs shadow-sm">
                          <span className="mb-1 block text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-blue-600">Total: {total}</span>
                            <span className="font-mono text-green-600">Done: {completed}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="pending"
                  stackId="a"
                  fill="var(--color-pending)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="completed"
                  stackId="a"
                  fill="var(--color-completed)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              Task completion rate improving <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing task progress for the current week
            </div>
          </CardFooter>
        </Card>
        {/* Planned vs Actual Time Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Actual Time</CardTitle>
            <CardDescription>
              Hours planned vs spent on tasks (Pomodoro sessions) this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={timeChartConfig}>
              <BarChart
                data={weeklyTimeStats}
                margin={{ left: -20 }}
                barGap={8}
                barCategoryGap={24}
                height={300}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="planned"
                  stackId="a"
                  fill="var(--color-planned)"
                  name="Planned"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  stackId="a"
                  fill="var(--color-actual)"
                  name="Actual"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsOverview;
