import {
  Outlet,
  createRootRoute,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { weeklyCalendarSchema } from './searchParams';
import { ThemeProvider } from '../components/theme-provider';
import BaseLayout from '../layouts/BaseLayout';

export const RootRoute = createRootRoute({
  component: Root,
  notFoundComponent: () => <div>Not Found 📄</div>,
  errorComponent: (props) => {
    console.error(props.error);
    return <div>Error 🚨</div>;
  },
  validateSearch: weeklyCalendarSchema,
  search: {
    middlewares: [retainSearchParams(['week', 'date', 'tab']), stripSearchParams({ date: 'week' })],
  },
});

function Root() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BaseLayout>
        <Outlet />
      </BaseLayout>
      <TanStackRouterDevtools />
    </ThemeProvider>
  );
}
