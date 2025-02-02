import {
  Outlet,
  createRootRoute,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { weeklyCalendarSchema } from './searchParams';
import { ThemeProvider } from '../components/theme-provider';

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Outlet />
      <TanStackRouterDevtools />
    </ThemeProvider>
  );
}
