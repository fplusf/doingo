import { toggleTaskCompletion } from '@/features/tasks/stores/tasks.store';
import { LocalStorageAdapter } from '@/shared/store/adapters/local-storage-adapter';
import { StorageAdapter } from '@/shared/store/adapters/storage-adapter';
import { Store } from '@tanstack/react-store';
import { v4 as uuidv4 } from 'uuid';
import { Reminder, ReminderList, RemindersState } from '../types';

// Initialize the storage adapter
const storageAdapter: StorageAdapter = new LocalStorageAdapter('optimal-adhd');

// Storage keys
const REMINDERS_STORAGE_KEY = 'reminders';
const LISTS_STORAGE_KEY = 'reminder-lists';
const SELECTED_LIST_STORAGE_KEY = 'selected-reminder-list';

// Default lists
const defaultLists: ReminderList[] = [
  {
    id: 'all',
    name: 'All',
    color: '#FF9500',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'upcoming',
    name: 'Upcoming',
    color: '#007AFF',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'overdue',
    name: 'Overdue',
    color: '#FF2D55',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Initialize store with reminders from storage
// First clear existing lists from storage to force using our new defaults
storageAdapter.saveItem(LISTS_STORAGE_KEY, defaultLists);
storageAdapter.saveItem(SELECTED_LIST_STORAGE_KEY, 'all');

export const remindersStore = new Store<RemindersState>({
  reminders: storageAdapter.getItem(REMINDERS_STORAGE_KEY) || [],
  lists: defaultLists, // Always use default lists
  selectedListId: 'all',
});

// Helper function to update state and storage
const updateStateAndStorage = (updater: (state: RemindersState) => RemindersState) => {
  const newState = updater(remindersStore.state);
  remindersStore.setState(() => newState);
  storageAdapter.saveItem(REMINDERS_STORAGE_KEY, newState.reminders);
  storageAdapter.saveItem(LISTS_STORAGE_KEY, newState.lists);
  storageAdapter.saveItem(SELECTED_LIST_STORAGE_KEY, newState.selectedListId);
};

// Selectors
export const getRemindersByList = (listId: string) => {
  if (listId === 'all') {
    return remindersStore.state.reminders;
  }

  if (listId === 'upcoming') {
    return getUpcomingReminders();
  }

  if (listId === 'overdue') {
    return getOverdueReminders();
  }

  return remindersStore.state.reminders.filter((reminder) => reminder.list === listId);
};

export const getOverdueReminders = () => {
  const now = Date.now();
  return remindersStore.state.reminders.filter(
    (reminder) => reminder.dueDate && reminder.dueDate < now && !reminder.completed,
  );
};

export const getUpcomingReminders = () => {
  const now = Date.now();
  return remindersStore.state.reminders.filter(
    (reminder) => reminder.dueDate && reminder.dueDate >= now && !reminder.completed,
  );
};

export const getListById = (listId: string) => {
  return remindersStore.state.lists.find((list) => list.id === listId);
};

export const getAllReminders = () => {
  return remindersStore.state.reminders;
};

// Actions
export const setSelectedList = (listId: string) => {
  remindersStore.setState((state) => ({
    ...state,
    selectedListId: listId,
  }));
  storageAdapter.saveItem(SELECTED_LIST_STORAGE_KEY, listId);
};

export const addReminder = (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = Date.now();
  updateStateAndStorage((state) => ({
    ...state,
    reminders: [
      ...state.reminders,
      {
        ...reminder,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        priority: reminder.priority || 'none',
      },
    ],
  }));
};

export const updateReminder = (id: string, updates: Partial<Reminder>) => {
  updateStateAndStorage((state) => ({
    ...state,
    reminders: state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, ...updates, updatedAt: Date.now() } : reminder,
    ),
  }));
};

export const deleteReminder = (id: string) => {
  updateStateAndStorage((state) => ({
    ...state,
    reminders: state.reminders.filter((reminder) => reminder.id !== id),
  }));
};

export const toggleReminderCompletion = (id: string) => {
  updateStateAndStorage((state) => ({
    ...state,
    reminders: state.reminders.map((reminder) =>
      reminder.id === id
        ? { ...reminder, completed: !reminder.completed, updatedAt: Date.now() }
        : reminder,
    ),
  }));

  // Also toggle the linked task if this reminder is linked to a task
  const reminder = remindersStore.state.reminders.find((r) => r.id === id);
  if (reminder && reminder.taskId) {
    toggleTaskCompletion(reminder.taskId);
  }
};

export const addList = (list: Omit<ReminderList, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = Date.now();
  updateStateAndStorage((state) => ({
    ...state,
    lists: [
      ...state.lists,
      {
        ...list,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      },
    ],
  }));
};

export const updateList = (id: string, updates: Partial<ReminderList>) => {
  updateStateAndStorage((state) => ({
    ...state,
    lists: state.lists.map((list) =>
      list.id === id ? { ...list, ...updates, updatedAt: Date.now() } : list,
    ),
  }));
};

export const deleteList = (id: string) => {
  updateStateAndStorage((state) => ({
    ...state,
    // Delete the list
    lists: state.lists.filter((list) => list.id !== id),
    // Delete all reminders in that list
    reminders: state.reminders.filter((reminder) => reminder.list !== id),
    // If the deleted list was selected, select the default list
    selectedListId: state.selectedListId === id ? 'all' : state.selectedListId,
  }));
};

export const clearReminders = () => {
  storageAdapter.clearItems([REMINDERS_STORAGE_KEY, LISTS_STORAGE_KEY, SELECTED_LIST_STORAGE_KEY]);

  remindersStore.setState(() => ({
    reminders: [],
    lists: defaultLists,
    selectedListId: 'all',
  }));
};
