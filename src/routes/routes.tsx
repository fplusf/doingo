import AuthCallbackPage from '@/features/auth/pages/auth-callback-page';
import LoginPage from '@/features/auth/pages/login-page';
import CalendarPage from '@/features/calendar/pages/calendar-page';
import InboxPage from '@/features/inbox/pages/inbox-page';
import TodayPage from '@/features/tasks/pages/today-page';
import ProfilePage from '@/features/user/pages/profile-page';
import { supabase } from '@/lib/supabase-client';

import { createRoute, Outlet, redirect, Route } from '@tanstack/react-router';
import RemindersPage from '../features/reminders/pages/reminders-page';
import TaskDetailsPage from '../features/tasks/pages/details-page';
import { TaskDetailHeader } from '../layouts/headers/task-details-header';
import { RootRoute } from './__root';
import { tasksSearchParamsSchema } from './searchParams';

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

// Helper: require user session else redirect to /login
const requireAuth = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw redirect({ to: '/login' });
  }
};

// Tasks Route - Parent route for all task-related routes
export const TasksRoute = new Route({
  getParentRoute: () => RootRoute,
  path: '/tasks',
  component: Outlet,
  validateSearch: tasksSearchParamsSchema,
  beforeLoad: requireAuth,
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
  beforeLoad: requireAuth,
});

// Calendar Route - For the calendar feature
export const CalendarRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'calendar',
  component: CalendarPage,
  beforeLoad: requireAuth,
});

// Inbox Route - For the inbox feature
export const InboxRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'inbox',
  component: InboxPage,
  beforeLoad: requireAuth,
});

// Profile Route - User profile page
export const ProfileRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'profile',
  component: ProfilePage,
  beforeLoad: requireAuth,
});

// Login Route - Public
export const LoginRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'login',
  component: LoginPage,
});

// Auth Callback Route - Public
export const AuthCallbackRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'auth/callback',
  component: AuthCallbackPage,
});

// Build the route tree with explicit parent-child relationships
export const rootTree = RootRoute.addChildren([
  IndexRoute,
  RemindersRoute,
  CalendarRoute,
  InboxRoute,
  ProfileRoute,
  LoginRoute,
  AuthCallbackRoute,
  TasksRoute.addChildren([TasksIndexRoute, TaskDetailsRoute]),
]);
