import { setFocused, tasksStore } from '@/features/tasks/stores/tasks.store';
import { OptimalTask } from '@/features/tasks/types/index';
import { NavUser } from '@/layouts/sidebar/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
import { BarChart, Bell, Calendar1Icon, LucideFocus } from 'lucide-react';
import * as React from 'react';

const data = {
  user: {
    name: 'Optimal ADHD',
    email: '',
    avatar: '/avatars/shadcn.jpg',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tasks = useStore(tasksStore, (state) => state.tasks) as OptimalTask[];
  const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  // Find the currently focused task
  const focusedTask = React.useMemo(() => {
    return tasks.find((task) => task.isFocused);
  }, [tasks]);

  // Get the first uncompleted task to focus when no task is focused
  const firstUncompletedTask = React.useMemo(() => {
    return tasks.find((task) => !task.completed);
  }, [tasks]);

  // Find today's focused task
  const todayFocusedTask = React.useMemo(() => {
    return tasks.find((task) => task.isFocused && task.taskDate === today);
  }, [tasks, today]);

  // Get today's first uncompleted task
  const todayFirstUncompletedTask = React.useMemo(() => {
    return tasks.find((task) => !task.completed && task.taskDate === today);
  }, [tasks, today]);

  // Determine the target task for the Focus button (today's focused or first uncompleted)
  const targetTodayTask = todayFocusedTask || todayFirstUncompletedTask;

  // Clear focus on tasks from days other than today
  React.useEffect(() => {
    // Get all focused tasks that are not today's tasks
    const focusedNonTodayTasks = tasks.filter((task) => task.isFocused && task.taskDate !== today);

    // If there are any focused tasks from other days, remove their focus
    if (focusedNonTodayTasks.length > 0) {
      focusedNonTodayTasks.forEach((task) => {
        setFocused(task.id, false);
      });
    }
  }, [tasks, today]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pt-10">
        <SidebarMenu className="mb-1">
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/tasks"
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
                to={targetTodayTask ? '/tasks/$taskId' : '/tasks'}
                params={targetTodayTask ? { taskId: targetTodayTask.id } : {}}
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <LucideFocus className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-2 truncate text-xs">Focus</span>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/inbox"
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
        </SidebarMenu> */}

        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/reminders"
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
                preload="intent"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <Bell className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-[11px]">Reminders</span>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/calendar"
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
        </SidebarMenu> */}

        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col items-center">
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/stats"
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                  <BarChart className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
            <span className="mt-0.5 truncate text-xs">Stats</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <div className="flex flex-col items-center gap-4">
          {/* <ToggleTheme /> */}
          <NavUser user={data.user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
