import { Focus, Hash, PaintBucket } from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/sidebar/nav-main';
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
  navMain: [
    {
      title: 'Backglog',
      url: 'groups/backlog',
      icon: PaintBucket,
      isActive: true,
      iconColor: 'gray',
    },
    {
      title: 'Work',
      url: 'groups/work',
      icon: Hash,
      isActive: false,
      iconColor: 'yellow',
    },
    {
      title: 'Personal',
      url: 'groups/personal',
      icon: Hash,
      iconColor: 'lightblue',
    },
    {
      title: 'Side hustle',
      url: 'groups/side-hustle',
      icon: Hash,
      iconColor: 'lightgreen',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props} className="top-10">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Focus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Focus</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
