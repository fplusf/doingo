import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { TopSidebarTrigger } from '@/components/sidebar/left-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';
import { DynamicHeader } from './headers/dynamic-header';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      {/* <HeaderComponent /> */}
      <DynamicHeader />

      <div className="relative flex flex-1">
        <SidebarProvider style={{ '--sidebar-width': '5rem' } as any}>
          <AppSidebar />
          <SidebarInset>
            <TopSidebarTrigger />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
