import { Calendar, ChevronUp, CircleCheckBig, Settings } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Link } from '@tanstack/react-router';
import React from 'react';

export function AppSidebar() {
  return (
    <Sidebar className="h-screen px-2 pb-2 pt-5">
      <SidebarContent className="flex h-full flex-col justify-between">
        <SidebarGroup className="p-0 pt-4">
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key={'task'} className="flex-1">
                <SidebarMenuButton
                  asChild
                  tooltip={{
                    children: 'Tasks',
                    hidden: false,
                  }}
                  className="h-10 w-10 p-0"
                >
                  <Link to="/" className="w-full">
                    <CircleCheckBig size={48} className="m-auto" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key={'calendar'} className="flex-1">
                <SidebarMenuButton
                  asChild
                  tooltip={{
                    children: 'Calendar',
                    hidden: false,
                  }}
                  className="h-10 w-10 p-0"
                >
                  <Link to="/" className="w-full">
                    <Calendar size={48} className="m-auto" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* TODO: Move them inside the settings menu */}
              {/* <LangToggle />
              <ToggleTheme /> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Settings />
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
