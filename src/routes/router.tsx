import { createRouter } from '@tanstack/react-router';
import { DragWindowRegionChildren } from '../shared/components/drag-window-region';
import { rootTree } from './routes';

// Define the router context types
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface RouteContext {
    headerConfig?: DragWindowRegionChildren;
  }
}

// const history = createMemoryHistory({ initialEntries: ['/'] });

// Create the router instance with proper configuration
export const router = createRouter({
  routeTree: rootTree,
  // history, FIXME: // This causing the weird error an all routes failing!!! Make sure it's needed before turning on!
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  // Provide default components for loading and error states
  defaultPendingComponent: () => (
    <div className="flex items-center justify-center p-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  ),
  defaultErrorComponent: ({ error }) => (
    <div className="p-4 text-red-500">
      <h1 className="text-lg font-bold">Error</h1>
      <p>{error?.message || 'An unknown error occurred'}</p>
    </div>
  ),
  // Remove basepath completely - not needed and can cause routing conflicts
  basepath: '/',
});

// Initialize the router
router.subscribe('onBeforeLoad', () => {
  console.log('Router initialized and ready');
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
