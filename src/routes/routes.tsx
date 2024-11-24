import AboutPage from '@/pages/AboutPage';
import { createRoute } from '@tanstack/react-router';
import { z } from 'zod';
import FocusPage from '../pages/FocusPage';
import Groups from '../pages/Groups';
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

// Define the search params schema
const weeklyCalendarSchema = z.object({
  week: z.string().default(new Date().toISOString().split('T')[0]).optional(),
  date: z.string().default(new Date().toISOString().split('T')[0]).optional(),
});

// Create type from schema
export type WeeklyCalendarSearch = z.infer<typeof weeklyCalendarSchema>;

export const FocusRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: FocusPage,
  validateSearch: weeklyCalendarSchema,
});

export const GroupRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/groups/$name',
  component: Groups,
});

export const AboutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/about',
  component: AboutPage,
});

export const rootTree = RootRoute.addChildren([FocusRoute, GroupRoute, AboutRoute]);
