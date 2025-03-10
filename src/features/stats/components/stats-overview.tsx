import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import React from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const sampleData = [
  { name: 'Mon', tasks: 4, completed: 3 },
  { name: 'Tue', tasks: 6, completed: 4 },
  { name: 'Wed', tasks: 8, completed: 7 },
  { name: 'Thu', tasks: 5, completed: 3 },
  { name: 'Fri', tasks: 7, completed: 6 },
  { name: 'Sat', tasks: 3, completed: 2 },
  { name: 'Sun', tasks: 2, completed: 2 },
];

const StatsOverview: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Statistics Overview</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
            <CardDescription>Number of tasks created vs completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sampleData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#93c5fd" name="Total Tasks" />
                <Bar dataKey="completed" fill="#4ade80" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trend</CardTitle>
            <CardDescription>Weekly completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sampleData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Completed Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsOverview;
