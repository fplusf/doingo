import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useStore } from '@tanstack/react-store';
import { BellRing } from 'lucide-react';
import * as React from 'react';
import { remindersStore } from '../store/reminders.store';
import type { Reminder } from '../types';
import { ReminderItem } from './reminder-item';

export function ReminderBellMenu() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState('due');
  // Use store to re-render immediately on reminder state change
  const reminders = useStore(remindersStore, (state) => state.reminders);
  const now = Date.now();
  // Consider both date and time (dueDate is ms timestamp)
  const dueReminders = reminders.filter(
    (r: Reminder) => typeof r.dueDate === 'number' && r.dueDate < now,
  );
  const upcomingReminders = reminders.filter(
    (r: Reminder) => typeof r.dueDate === 'number' && r.dueDate >= now,
  );

  // Split reminders into incomplete and completed
  const splitReminders = (reminders: Reminder[]) => {
    const active = reminders.filter((r) => !r.completed);
    const completed = reminders.filter((r) => r.completed);
    return { active, completed };
  };

  const renderRemindersList = (reminders: Reminder[]) => {
    const { active, completed } = splitReminders(reminders);
    return (
      <div className="max-h-64 overflow-y-auto">
        {active.length === 0 && completed.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No reminders</div>
        ) : (
          <>
            {active.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
            {completed.length > 0 && (
              <>
                <div className="my-2 border-t border-muted-foreground/20" />
                {completed.map((reminder) => (
                  <ReminderItem key={reminder.id} reminder={reminder} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button aria-label="Reminders">
          <BellRing className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="due" className="flex-1">
              Due
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
            </TabsTrigger>
          </TabsList>
          <TabsContent value="due">{renderRemindersList(dueReminders)}</TabsContent>
          <TabsContent value="upcoming">{renderRemindersList(upcomingReminders)}</TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
