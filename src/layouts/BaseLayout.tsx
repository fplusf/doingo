import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import React from 'react';
import DragWindowRegion from '../components/DragWindowRegion';
import { AppSidebar } from './Sidebar';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DragWindowRegion />

      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </>
  );
}
