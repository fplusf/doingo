import { createRouter } from '@tanstack/react-router';
import { rootTree } from './routes';
import { DragWindowRegionChildren } from '../components/drag-window-region';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface RouteContext {
    headerConfig?: DragWindowRegionChildren;
  }
}

// const history = createMemoryHistory({ initialEntries: ['/'] });

export const router = createRouter({
  routeTree: rootTree,
  // history, FIXME: // This causing the weird error an all routes failing!!! Make sure it's needed before turning on!
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  basepath: '/tasks',
});
