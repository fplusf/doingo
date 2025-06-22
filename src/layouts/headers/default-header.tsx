import { useAuth } from '@/features/auth/auth-context';
import { ReminderBellMenu } from '@/features/reminders/components/reminder-bell-menu';
import { useWeekNavigation } from '@/features/tasks/hooks/use-week-navigation';
import { DatePicker } from '@/layouts/headers/header-calendar';
import { NavUser } from '@/layouts/sidebar/nav-user';
import { DragWindowRegion } from '@/shared/components/drag-window-region';
import { Button } from '@/shared/components/ui/button';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { BarChart, ChevronLeft, ChevronRight } from 'lucide-react';

function TasksHeader() {
  const { handleNext, handlePrev, navigateToDate } = useWeekNavigation();
  const search = useSearch({ from: '/tasks' });
  const navigate = useNavigate({ from: '/tasks' });
  const date = search.date || new Date().toISOString().split('T')[0];
  const isDetailsOpen = !!search.taskId;
  const { user, signInWithGoogle, signOut } = useAuth();
  const userInfo = user
    ? {
        name: (user.user_metadata as any)?.full_name ?? user.email ?? 'User',
        email: user.email ?? '',
        avatar: (user.user_metadata as any)?.avatar_url ?? '',
      }
    : null;

  return (
    <DragWindowRegion>
      {{
        left: () => (
          <div className="ml-2 flex items-center">
            {isDetailsOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, taskId: undefined, tab: 'document' }),
                  })
                }
                className="h-7 w-7"
              >
                <ChevronLeft />
              </Button>
            )}
            <div className="ml-2 flex items-center justify-center">
              <span
                onClick={() => navigateToDate(new Date())}
                className="mx-2 w-[127px] cursor-pointer text-center"
              >
                {format(new Date(date), 'MMMM yyyy')}
              </span>
              <Button onClick={handlePrev} variant="ghost" size="icon" className="mr-2 h-7 w-7">
                <ChevronLeft />
              </Button>
              <Button onClick={handleNext} variant="ghost" size="icon" className="mr-4 h-7 w-7">
                <ChevronRight />
              </Button>
              <DatePicker />
            </div>
          </div>
        ),
        center: () => <div />,
        right: () => (
          <div className="mr-2 flex items-center gap-4 py-2">
            <ReminderBellMenu />
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link
                to="/tasks"
                search={(prev) => ({ ...prev, overlay: 'stats' })}
                activeProps={{ className: 'active' }}
                inactiveProps={{ className: 'inactive' }}
              >
                <BarChart className="h-4 w-4" />
              </Link>
            </Button>
            {userInfo ? (
              <NavUser user={userInfo} onLogout={signOut} />
            ) : (
              <Button onClick={signInWithGoogle} variant="ghost" size="sm">
                Sign in
              </Button>
            )}
          </div>
        ),
      }}
    </DragWindowRegion>
  );
}

export function DefaultHeader() {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const isTasksRoute = currentPath === '/tasks';

  // If not on tasks route, show a simplified header with a link to tasks
  if (!isTasksRoute) {
    return (
      <DragWindowRegion>
        {{
          left: () => (
            <div className="ml-12 flex max-w-max">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/tasks' })}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Tasks
              </Button>
            </div>
          ),
          center: () => <div />,
          right: () => (
            <div className="mr-2 flex items-center gap-4 py-2">
              <ReminderBellMenu />
            </div>
          ),
        }}
      </DragWindowRegion>
    );
  }

  return <TasksHeader />;
}
