import { setFocused, tasksStore } from '@/features/tasks/store/tasks.store';
import { NavUser } from '@/layouts/sidebar/nav-user';
import ToggleTheme from '@/shared/components/toggle-theme';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { Link, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { BarChart, Bell, Calendar, Calendar1Icon, LucideFocus } from 'lucide-react';
import * as React from 'react';

const data = {
  user: {
    name: 'Optimal ADHD',
    email: '',
    avatar: '/avatars/shadcn.jpg',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tasks = useStore(tasksStore, (state) => state.tasks);
  const navigate = useNavigate();

  // Find the currently focused task
  const focusedTask = React.useMemo(() => {
    return tasks.find((task) => task.isFocused);
  }, [tasks]);

  // Get the first uncompleted task to focus when no task is focused
  const firstUncompletedTask = React.useMemo(() => {
    return tasks.find((task) => !task.completed);
  }, [tasks]);

  // Handle focusing the first available task if no task is focused
  const handleFocusClick = (e: React.MouseEvent) => {
    if (!focusedTask && firstUncompletedTask) {
      e.preventDefault();
      setFocused(firstUncompletedTask.id, true);
      navigate({ to: '/tasks/$taskId', params: { taskId: firstUncompletedTask.id } });
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pt-10">
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
                  <Calendar1Icon className="size-4" />
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
                to="/tasks/$taskId"
                params={{ taskId: focusedTask?.id || firstUncompletedTask?.id || '1' }}
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
                onClick={handleFocusClick}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <LucideFocus className={`size-4 ${focusedTask ? 'fill-blue-500' : ''}`} />
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
                to="/"
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
                to="/"
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
                to="/"
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
