import { TagDetails } from '@/components/tags';
import AboutPage from '@/pages/about-page';
import FocusPage from '@/pages/focus-page';
import Tags from '@/pages/tags-page';
import TaskDetailsPage from '@/pages/task-details-page';
import { createRoute } from '@tanstack/react-router';
import { RootRoute } from './__root';
import BaseLayout from '@/layouts/BaseLayout';

const withBaseLayout = (Component: React.ComponentType<any>) => {
  return function WrappedComponent(props: any) {
    return (
      <BaseLayout>
        {/* TODO: In order to render routed components within the main Layout
        make sure the useWeekNavigation search params used exist within the component below?
        or maybe has access so it doesn't throw a shitty error! Same error caused for other routes as well */}
        <Component {...props} />
      </BaseLayout>
    );
  };
};

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

export const TodayRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: withBaseLayout(FocusPage),
});

export const TaskDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '$taskId',
  component: TaskDetailsPage,
});

// Parent route for /tags
export const TagsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/tags',
  component: withBaseLayout(Tags),
});

// Child route for /tags/$tagName
export const TagDetailsRoute = createRoute({
  getParentRoute: () => TagsRoute,
  path: '$tagName',
  component: withBaseLayout(TagDetails),
});

export const AboutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/about',
  component: withBaseLayout(AboutPage),
});

export const rootTree = RootRoute.addChildren([
  TodayRoute,
  TaskDetailsRoute,
  TagsRoute,
  AboutRoute,
  TagDetailsRoute,
]);
