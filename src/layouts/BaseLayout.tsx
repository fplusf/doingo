import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { TopSidebarTrigger } from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';
import { DynamicHeader } from './headers/dynamic-header';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <DynamicHeader />

      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
          <AppSidebar />
          <SidebarInset className="top-12 h-[calc(100vh-4rem)] overflow-hidden">
            <TopSidebarTrigger />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
