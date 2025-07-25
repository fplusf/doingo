import { AuthProvider } from '@/features/auth/auth-context';
import { AppSidebar } from '@/layouts/sidebar/app-sidebar';
import { ThemeProvider } from '@/shared/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  createRootRouteWithContext,
  retainSearchParams,
  stripSearchParams,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { DynamicHeader } from '../layouts/headers/dynamic-header';
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
  const { location } = useRouterState();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/auth/callback';

  if (isAuthPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Outlet />
            <TanStackRouterDevtools />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen w-full flex-col">
            <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
              <DynamicHeader />
              <div className="flex min-h-0 flex-1 flex-row">
                <AppSidebar />
                <SidebarInset className="top-10 h-[calc(100vh-3rem)] overflow-hidden">
                  <Outlet />
                </SidebarInset>
              </div>
            </SidebarProvider>
          </div>
          <TanStackRouterDevtools />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
