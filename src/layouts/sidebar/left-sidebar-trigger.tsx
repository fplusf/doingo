import { SidebarTrigger, useSidebar } from '@/shared/components/ui/sidebar';
import React from 'react';
import { layoutStore, toggleSidebarState } from '../store/layout.store';

export const TopSidebarTrigger: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  layoutStore.subscribe(() => {
    toggleSidebar();
  });

  return (
    <SidebarTrigger
      onClick={() => {
        toggleSidebarState(false);
      }}
      className="-ml-1 hidden"
    />
  );
};

/**
 *
 * @returns This component triggers the Store/State to toggle the sidebar
 * and then the component above just listens to the state change and triggers the sidebar
 * to open/close using the Sidebar context.
 *
 * This hack done since, the Sidebar context can't be use outside the SidebarContext
 * and in this case we need to keep the DragWindowRegion outside of the SidebarContext.
 */
export const TopSidebarTriggerVisible = ({ className }: { className?: string }) => {
  return null;
};
