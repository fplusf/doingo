import CalendarPage from '@/features/calendar/pages/calendar-page';
import StatsOverview from '@/features/stats/components/stats-overview';
import TodayPage from '@/features/tasks/pages/today-page';

import { createRoute, Outlet, redirect } from '@tanstack/react-router';
import RemindersPage from '../features/reminders/pages/reminders-page';
import TaskDetailsPage from '../features/tasks/pages/details-page';
import { TaskDetailHeader } from '../layouts/headers/task-details-header';
import { RootRoute } from './__root';

// TODO: Steps to add a new route:
// 1. Create a new page component in the '../pages/' directory (e.g., NewPage.tsx)
// 2. Import the new page component at the top of this file
// 3. Define a new route for the page using createRoute()
// 4. Add the new route to the routeTree in RootRoute.addChildren([...])
// 5. Add a new Link in the navigation section of RootRoute if needed

// Example of adding a new route:
// 1. Create '../pages/NewPage.tsx'
// 2. Import: import NewPage from '../pages/NewPage';
// 3. Define route:
//    const NewRoute = createRoute({
//      getParentRoute: () => RootRoute,
//      path: '/new',
//      component: NewPage,
//    });
// 4. Add to routeTree: RootRoute.addChildren([HomeRoute, NewRoute, ...])
// 5. Add Link: <Link to="/new">New Page</Link>

// Index Route (redirects to tasks)
export const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});

// Tasks Route - Parent route for all task-related routes
export const TasksRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'tasks',
  component: Outlet, // Using Outlet to render child routes
});

// Tasks Index Route - The default route when navigating to /tasks
export const TasksIndexRoute = createRoute({
  getParentRoute: () => TasksRoute,
  path: '/',
  component: TodayPage,
});

// Task Details Route - For viewing individual task details
export const TaskDetailsRoute = createRoute({
  getParentRoute: () => TasksRoute,
  path: '$taskId',
  component: TaskDetailsPage,
  errorComponent: () => <div>Task details error 🚨</div>,
  context: () => ({
    headerConfig: TaskDetailHeader(),
  }),
});

// Reminders Route - Parent route for reminders feature
export const RemindersRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'reminders',
  component: RemindersPage,
});

// Calendar Route - For the calendar feature
export const CalendarRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'calendar',
  component: CalendarPage,
});

// Stats Route - For viewing statistics and analytics
export const StatsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'stats',
  component: StatsOverview,
});

// Build the route tree with explicit parent-child relationships
export const rootTree = RootRoute.addChildren([
  IndexRoute,
  RemindersRoute,
  CalendarRoute,
  StatsRoute,
  TasksRoute.addChildren([TasksIndexRoute, TaskDetailsRoute]),
]);
