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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { toast } from '@/shared/hooks/use-toast';
import { Link, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format } from 'date-fns';
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
  const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
  const navigate = useNavigate();
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

  // Handle focusing the first available task if no task is focused
  const handleFocusClick = (e: React.MouseEvent) => {
    if (!isToday) {
      e.preventDefault();
      // Show toast notification for tasks from other days
      toast({
        title: 'Focus not available',
        description:
          "Focusing possible only on today's tasks. If you want to focus on a task, move it to today.",
        duration: 5000,
      });
      return;
    }

    if (!focusedTask && firstUncompletedTask) {
      e.preventDefault();
      setFocused(firstUncompletedTask.id, true);
    }
  };

  // Handle opening task details
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (focusedTask) {
      navigate({ to: '/tasks/$taskId', params: { taskId: focusedTask.id } });
    } else if (firstUncompletedTask) {
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
            <SidebarMenuButton size="lg" asChild disabled={!isToday}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={focusedTask || firstUncompletedTask ? '/tasks/$taskId' : '/'}
                    params={
                      focusedTask || firstUncompletedTask
                        ? { taskId: focusedTask?.id || firstUncompletedTask?.id }
                        : {}
                    }
                    activeProps={{ className: 'active' }}
                    inactiveProps={{ className: 'inactive' }}
                    onClick={(e) => {
                      if (!isToday) {
                        e.preventDefault();
                        return;
                      }
                      handleDetailsClick(e);
                    }}
                    className={!isToday ? 'cursor-not-allowed opacity-50' : ''}
                    aria-disabled={!isToday}
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg [.active_&]:bg-sidebar-primary [.inactive_&]:bg-muted">
                      <LucideFocus className="size-4" />
                    </div>
                  </Link>
                </TooltipTrigger>
                {!isToday && (
                  <TooltipContent side="right" className="z-50 text-xs">
                    <p>Focus available only on today's tasks</p>
                  </TooltipContent>
                )}
              </Tooltip>
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
