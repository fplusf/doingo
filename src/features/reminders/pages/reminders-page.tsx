import { ListDialog } from '@/features/reminders/components/list-dialog';
import { ReminderDialog } from '@/features/reminders/components/reminder-dialog';
import { ReminderItem } from '@/features/reminders/components/reminder-item';
import { ReminderListItem } from '@/features/reminders/components/reminder-list-item';
import {
  deleteList,
  getListById,
  getRemindersByList,
  remindersStore,
} from '@/features/reminders/store/reminders.store';
import { Reminder } from '@/features/reminders/types';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { useStore } from '@tanstack/react-store';
import { Edit, MoreVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

export default function RemindersPage() {
  const lists = useStore(remindersStore, (state) => state.lists);
  const selectedListId = useStore(remindersStore, (state) => state.selectedListId);
  const reminders = useStore(remindersStore, (state) =>
    getRemindersByList(state.selectedListId || 'reminders'),
  );

  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [selectedReminder, setSelectedReminder] = React.useState<Reminder | undefined>(undefined);
  const [listDialogOpen, setListDialogOpen] = React.useState(false);
  const [editingList, setEditingList] = React.useState<any>(undefined);

  const selectedList = getListById(selectedListId || 'reminders');

  const handleAddReminder = () => {
    setSelectedReminder(undefined);
    setReminderDialogOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setReminderDialogOpen(true);
  };

  const handleAddList = () => {
    setEditingList(undefined);
    setListDialogOpen(true);
  };

  const handleEditList = () => {
    if (selectedList) {
      setEditingList(selectedList);
      setListDialogOpen(true);
    }
  };

  const handleDeleteList = () => {
    if (selectedListId && selectedListId !== 'reminders') {
      deleteList(selectedListId);
    }
  };

  // Get counts for each list
  const listCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    lists.forEach((list) => {
      counts[list.id] = getRemindersByList(list.id).length;
    });

    return counts;
  }, [lists]);

  // Filter reminders into completed and incomplete
  const incompleteReminders = reminders.filter((reminder) => !reminder.completed);
  const completedReminders = reminders.filter((reminder) => reminder.completed);

  return (
    <div className="flex h-full">
      {/* Sidebar with lists */}
      <div className="flex h-full w-64 flex-col border-r">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">My Lists</h2>
          <Button variant="ghost" size="icon" onClick={handleAddList} aria-label="Add new list">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-2">
            {lists.map((list) => (
              <ReminderListItem
                key={list.id}
                list={list}
                isActive={selectedListId === list.id}
                count={listCounts[list.id] || 0}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex h-full flex-1 flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            {selectedList && (
              <>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selectedList.color }}
                />
                <h1 className="text-xl font-semibold">{selectedList.name}</h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddReminder}>Add Reminder</Button>
            {selectedListId && selectedListId !== 'reminders' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditList}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit List</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteList} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete List</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {incompleteReminders.length > 0 && (
              <div className="space-y-1">
                {incompleteReminders.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    onClick={handleEditReminder}
                  />
                ))}
              </div>
            )}

            {completedReminders.length > 0 && (
              <div className="mt-6 space-y-2">
                <Separator />
                <h3 className="px-4 text-sm font-medium text-muted-foreground">
                  Completed ({completedReminders.length})
                </h3>
                <div className="space-y-1">
                  {completedReminders.map((reminder) => (
                    <ReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onClick={handleEditReminder}
                    />
                  ))}
                </div>
              </div>
            )}

            {reminders.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No reminders</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Get started by adding a new reminder
                </p>
                <Button onClick={handleAddReminder}>Add Reminder</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        reminder={selectedReminder}
      />
      <ListDialog open={listDialogOpen} onOpenChange={setListDialogOpen} list={editingList} />
    </div>
  );
}
