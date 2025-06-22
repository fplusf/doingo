import { DynamicHeader } from '@/layouts/headers/dynamic-header';
import { cn } from '@/lib/utils';
import { Outlet } from '@tanstack/react-router';

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <DynamicHeader />
      <main className={cn('flex-1 overflow-hidden bg-background')}>
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
