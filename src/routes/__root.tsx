import { ThemeProvider } from '@/shared/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  createRootRouteWithContext,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { DynamicHeader } from '../layouts/headers/dynamic-header';
import { AppSidebar } from '../layouts/sidebar/app-sidebar';
import { TopSidebarTrigger } from '../layouts/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '../shared/components/ui/sidebar';
import { weeklyCalendarSchema } from './searchParams';

export const RootRoute = createRootRouteWithContext()({
  // {AuthProvider: () => <AuthProvider />, // TODO: Add auth provider})({
  component: Root,
  notFoundComponent: () => <div>Not Found 📄</div>,
  errorComponent: (props) => {
    console.error('Root Route Error: ', props.error);
    return <div>Error 🚨</div>;
  },
  validateSearch: weeklyCalendarSchema,
  search: {
    middlewares: [retainSearchParams(['week', 'date', 'tab']), stripSearchParams({ date: 'week' })],
  },
});

// Create a new QueryClient instance
const queryClient = new QueryClient();

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="flex h-screen w-full flex-col">
          <DynamicHeader />

          <div className="flex min-h-0 flex-1 flex-col">
            <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
              <AppSidebar />
              <SidebarInset className="top-12 h-[calc(100vh-4rem)] overflow-hidden">
                <TopSidebarTrigger />
                <Outlet />
              </SidebarInset>
            </SidebarProvider>
          </div>
        </div>
        <TanStackRouterDevtools />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
