import { PanelLeft, PanelRight } from 'lucide-react';
import React, { useSyncExternalStore } from 'react';
import { layoutStore, toggleSidebarState } from '../../layouts/state/layout.store';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { cn } from '../../lib/utils';

export const TopSidebarTrigger: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  layoutStore.subscribe(() => {
    toggleSidebar();
  });

  return (
    <SidebarTrigger
      onChange={(value) => {
        toggleSidebarState(value as unknown as boolean);
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
export const TopSidebarTriggerVisible = ({ className }: { className: string }) => {
  const sidebarState = useSyncExternalStore(
    layoutStore.subscribe,
    () => layoutStore.state.sidebar.isClosed,
  );

  return (
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn('z-50 h-7 w-7', className)}
      onClick={() => {
        toggleSidebarState(sidebarState ? false : true);
        console.log('Left sidebar trigger clicked');
      }}
    >
      {sidebarState ? <PanelLeft /> : <PanelRight />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};
