import { tasksStore } from '@/features/tasks/stores/tasks.store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/components/ui/chart';
import { useStore } from '@tanstack/react-store';
import { addDays, format, startOfWeek } from 'date-fns';
import React, { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const StatsOverview: React.FC = () => {
  // Get tasks from store
  const tasks = useStore(tasksStore, (state) => state.tasks);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekData = [];

    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // Filter tasks for the current date
      const dayTasks = tasks.filter((task) => task.taskDate === dateStr);
      const completedTasks = dayTasks.filter((task) => task.completed);

      weekData.push({
        name: format(currentDate, 'EEE'),
        tasks: dayTasks.length,
        completed: completedTasks.length,
      });
    }

    return weekData;
  }, [tasks]);

  // Calculate weekly planned vs actual time (in hours)
  const weeklyTimeStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
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
      color: 'var(--chart-1)',
    },
    actual: {
      label: 'Actual',
      color: 'var(--chart-2)',
    },
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Statistics Overview</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Task Overview (existing) */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
            <CardDescription>Number of tasks created vs completed this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyStats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#93c5fd" name="Total Tasks" />
                <Bar dataKey="completed" fill="#4ade80" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
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
                  fill="var(--chart-1)"
                  name="Planned"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  stackId="a"
                  fill="var(--chart-2)"
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
