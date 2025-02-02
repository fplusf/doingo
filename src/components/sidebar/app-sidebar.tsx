import { Focus, Inbox, Bell, Calendar, BarChart } from 'lucide-react';
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
import ToggleTheme from '../ToggleTheme';

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
            <span className="mt-0.5 truncate text-xs">Today</span>
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
                  <Inbox className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Inbox</span>
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
                  <Bell className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Reminders</span>
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
                  <Calendar className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Calendar</span>
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
                  <BarChart className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Analytics</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <div className="flex flex-col items-center gap-4">
          <ToggleTheme />
          <NavUser user={data.user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
