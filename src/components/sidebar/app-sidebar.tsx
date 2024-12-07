import { Component, Focus } from 'lucide-react';
import * as React from 'react';

import { NavUser } from '@/components/sidebar/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';

const data = {
  user: {
    name: 'Optimal ADHD',
    email: '',
    avatar: '/avatars/shadcn.jpg',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props} className="top-10">
      <SidebarHeader>
        <SidebarMenu className="mb-1">
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/"
                search={(prev) => ({ ...prev })}
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <Focus className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Focus</span>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/tags"
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <Component className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Groups</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
