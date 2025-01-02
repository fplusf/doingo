import {
  Outlet,
  createRootRoute,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import React from 'react';
import { weeklyCalendarSchema } from './searchParams';

export const RootRoute = createRootRoute({
  component: Root,
  notFoundComponent: () => <div>Not Found 📄</div>,
  validateSearch: weeklyCalendarSchema,
  search: {
    middlewares: [retainSearchParams(['week', 'date']), stripSearchParams({ date: 'week' })],
  },
});

function Root() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}
