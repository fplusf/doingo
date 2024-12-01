import DragWindowRegion from '@/components/DragWindowRegion';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import {
  TopSidebarTrigger,
  TopSidebarTriggerVisible,
} from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion>
        <TopSidebarTriggerVisible />
        <div className="ml-32 flex max-w-max">
          Today, 18 Nov <span className="font-semibold text-green-600">&nbsp;2024</span>
        </div>
      </DragWindowRegion>

      <div className="relative flex flex-1">
        <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
          <AppSidebar />
          <SidebarInset>
            {/* <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <TopSidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>
            </header> */}

            {/* KEEP THIS COMPONENT HERE FOR SIDEBAR TO TOGGLE PROPERLY */}
            <TopSidebarTrigger />
            {/* <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div> */}
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
