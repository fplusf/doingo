import BaseLayout from '@/layouts/BaseLayout';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import React from 'react';

export const RootRoute = createRootRoute({
  component: Root,
  notFoundComponent: () => <div>Not Found 📄</div>,
});

function Root() {
  return (
    <BaseLayout>
      <Outlet />
      <TanStackRouterDevtools />
    </BaseLayout>
  );
}
