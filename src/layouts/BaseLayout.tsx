import DragWindowRegion from '@/components/DragWindowRegion';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import {
  TopSidebarTrigger,
  TopSidebarTriggerVisible,
} from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import React from 'react';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion>
        <TopSidebarTriggerVisible />
      </DragWindowRegion>

      <div className="relative flex flex-1">
        <SidebarProvider style={{ '--sidebar-width': '15rem' } as any}>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <TopSidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{/* Content */}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
