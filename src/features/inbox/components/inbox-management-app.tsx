import type React from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Inbox,
  MoreVertical,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import InboxkList from './inbox-list';

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  tags: string[];
  list: string;
  priority: 'high' | 'medium' | 'low' | null;
};

export type List = {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color?: string;
};

export default function InboxManagementApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedView, setSelectedView] = useState('today');
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    today: true,
    habit: true,
  });
  const [tags, setTags] = useState<string[]>(['random', 'jkkl', 'nkkk']);
  const [lists, setLists] = useState<List[]>([
    {
      id: 'welcome',
      name: 'Welcome',
      icon: <span className="text-yellow-500">👋</span>,
      count: 10,
    },
    {
      id: 'doingo',
      name: 'Doingo',
      icon: <span className="text-blue-500">🎯</span>,
      count: 17,
      color: 'blue',
    },
    { id: 'study', name: 'Study', icon: <span>📚</span>, count: 0 },
    { id: 'personal', name: 'Personal', icon: <span>🏠</span>, count: 0 },
  ]);

  // Initialize with sample tasks
  useEffect(() => {
    const initialTasks: Task[] = [
      {
        id: '1',
        title: 'Dashboard and Overall Layout',
        completed: false,
        dueDate: 'Jan 3',
        tags: ['doingo'],
        list: 'doingo',
        priority: 'high',
      },
      {
        id: '2',
        title: 'Gamification elements + Mini Games asdf',
        completed: false,
        dueDate: 'Jan 5',
        tags: ['doingo'],
        list: 'doingo',
        priority: null,
      },
      {
        id: '3',
        title: 'What else can be done today?',
        completed: false,
        dueDate: 'Jan 9',
        tags: ['doingo'],
        list: 'doingo',
        priority: 'high',
      },
      {
        id: '4',
        title: 'iOS style daily calendar pagination with round chart',
        completed: false,
        dueDate: 'Jan 9',
        tags: ['random', 'doingo'],
        list: 'doingo',
        priority: null,
      },
      {
        id: '5',
        title: 'Find an open source react based todo list / editor to copy paste later',
        completed: false,
        dueDate: 'Jan 27',
        tags: ['doingo'],
        list: 'doingo',
        priority: null,
      },
      {
        id: '6',
        title: 'Complete the CRUD for optimalf',
        completed: false,
        dueDate: 'Feb 11',
        tags: ['doingo'],
        list: 'doingo',
        priority: null,
      },
      {
        id: '7',
        title: 'Calendar: Check your schedule',
        completed: false,
        dueDate: 'Mar 4',
        tags: ['welcome'],
        list: 'welcome',
        priority: 'high',
      },
      {
        id: '8',
        title: 'Subscription Calendar: Never miss events',
        completed: false,
        dueDate: 'Mar 8',
        tags: ['welcome'],
        list: 'welcome',
        priority: null,
      },
      {
        id: '9',
        title: 'High Value - Attitude & Behavior',
        completed: false,
        dueDate: 'today',
        tags: [],
        list: 'habit',
        priority: null,
      },
    ];

    setTasks(initialTasks);
  }, []);

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    );
  };

  const updateTaskTitle = (taskId: string, newTitle: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, title: newTitle } : task)));
  };

  const addNewTask = () => {
    if (newTaskTitle.trim() === '') return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      dueDate: null,
      tags: [],
      list: 'inbox',
      priority: null,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  type SectionKey = keyof typeof expandedSections;

  const toggleSection = (section: SectionKey) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const getFilteredTasks = () => {
    if (selectedView === 'all') {
      return tasks;
    } else if (selectedView === 'today') {
      return tasks.filter(
        (task) =>
          task.dueDate === 'today' ||
          task.dueDate === 'Jan 3' ||
          task.dueDate === 'Jan 5' ||
          task.dueDate === 'Jan 9',
      );
    } else if (selectedView === 'next7days') {
      return tasks.filter(
        (task) =>
          task.dueDate === 'today' ||
          task.dueDate === 'Jan 3' ||
          task.dueDate === 'Jan 5' ||
          task.dueDate === 'Jan 9' ||
          task.dueDate === 'Jan 27',
      );
    } else if (selectedView === 'inbox') {
      return tasks.filter((task) => task.list === 'inbox');
    } else if (selectedView.startsWith('tag:')) {
      const tag = selectedView.replace('tag:', '');
      return tasks.filter((task) => task.tags.includes(tag));
    } else if (selectedView.startsWith('list:')) {
      const list = selectedView.replace('list:', '');
      return tasks.filter((task) => task.list === list);
    }

    return tasks;
  };

  const getOverdueTasks = () => {
    return getFilteredTasks().filter(
      (task) => task.dueDate === 'Jan 3' || task.dueDate === 'Jan 5' || task.dueDate === 'Jan 9',
    );
  };

  const getTodayTasks = () => {
    return getFilteredTasks().filter((task) => task.dueDate === 'today');
  };

  const getHabitTasks = () => {
    return getFilteredTasks().filter((task) => task.list === 'habit');
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="flex w-60 flex-col border-r border-border bg-muted/30">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Default views */}
            <div className="space-y-1">
              <Button
                variant={selectedView === 'all' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedView('all')}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">All</span>
                <span className="text-sm text-muted-foreground">{tasks.length}</span>
              </Button>

              <Button
                variant={selectedView === 'today' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedView('today')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Today</span>
                <span className="text-sm text-muted-foreground">9</span>
              </Button>

              <Button
                variant={selectedView === 'next7days' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedView('next7days')}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Next 7 Days</span>
                <span className="text-sm text-muted-foreground">9</span>
              </Button>

              <Button
                variant={selectedView === 'inbox' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedView('inbox')}
              >
                <Inbox className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Inbox</span>
                <span className="text-sm text-muted-foreground">2</span>
              </Button>
            </div>

            {/* Lists */}
            <div>
              <h3 className="mb-2 px-2 text-sm font-medium">Lists</h3>
              <div className="space-y-1">
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant={selectedView === `list:${list.id}` ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedView(`list:${list.id}`)}
                  >
                    {list.icon}
                    <span className="ml-2 flex-1 text-left">{list.name}</span>
                    <span className="text-sm text-muted-foreground">{list.count}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="mb-2 px-2 text-sm font-medium">Filters</h3>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Display tasks filtered by list, date, priority, tag, and more
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="mb-2 px-2 text-sm font-medium">Tags</h3>
              <div className="space-y-1">
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedView === `tag:${tag}` ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedView(`tag:${tag}`)}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">{tag}</span>
                    {tag === 'random' && <span className="text-sm text-muted-foreground">1</span>}
                    {tag === 'jkkl' && <span className="text-sm text-muted-foreground"></span>}
                    {tag === 'nkkk' && <span className="text-sm text-muted-foreground"></span>}
                  </Button>
                ))}
              </div>
            </div>

            {/* Completed & Trash */}
            <div className="space-y-1 pt-2">
              <Button variant="ghost" className="w-full justify-start">
                <CheckSquare className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Completed</span>
              </Button>

              <Button variant="ghost" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Trash</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border p-4">
          <h1 className="text-xl font-semibold">
            {selectedView === 'all' && 'All'}
            {selectedView === 'today' && 'Today'}
            {selectedView === 'next7days' && 'Next 7 Days'}
            {selectedView === 'inbox' && 'Inbox'}
            {selectedView.startsWith('tag:') && tags.find((tag) => `tag:${tag}` === selectedView)}
            {selectedView.startsWith('list:') &&
              lists.find((list) => `list:${list.id}` === selectedView)?.name}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Task input */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder={`Add task to "${selectedView === 'inbox' ? 'Inbox' : 'Today'}"`}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addNewTask();
                }
              }}
              className="flex-1"
            />
            <Button onClick={addNewTask}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task lists */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Overdue section */}
            {getOverdueTasks().length > 0 && (
              <div>
                <div
                  className="mb-2 flex cursor-pointer items-center gap-2"
                  onClick={() => toggleSection('overdue')}
                >
                  {expandedSections.overdue ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h2 className="text-sm font-medium text-muted-foreground">Overdue</h2>
                  <span className="text-sm text-muted-foreground">{getOverdueTasks().length}</span>
                  <div className="flex-1"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Postpone
                  </Button>
                </div>

                {expandedSections.overdue && (
                  <InboxkList
                    tasks={getOverdueTasks()}
                    toggleTaskCompletion={toggleTaskCompletion}
                    updateTaskTitle={updateTaskTitle}
                  />
                )}
              </div>
            )}

            {/* Today section */}
            {getTodayTasks().length > 0 && (
              <div>
                <div
                  className="mb-2 flex cursor-pointer items-center gap-2"
                  onClick={() => toggleSection('today')}
                >
                  {expandedSections.today ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h2 className="text-sm font-medium text-muted-foreground">Today</h2>
                  <span className="text-sm text-muted-foreground">{getTodayTasks().length}</span>
                </div>

                {expandedSections.today && (
                  <InboxkList
                    tasks={getTodayTasks()}
                    toggleTaskCompletion={toggleTaskCompletion}
                    updateTaskTitle={updateTaskTitle}
                  />
                )}
              </div>
            )}

            {/* Habit section */}
            {getHabitTasks().length > 0 && (
              <div>
                <div
                  className="mb-2 flex cursor-pointer items-center gap-2"
                  onClick={() => toggleSection('habit')}
                >
                  {expandedSections.habit ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h2 className="text-sm font-medium text-muted-foreground">Habit</h2>
                  <span className="text-sm text-muted-foreground">{getHabitTasks().length}</span>
                </div>

                {expandedSections.habit && (
                  <InboxkList
                    tasks={getHabitTasks()}
                    toggleTaskCompletion={toggleTaskCompletion}
                    updateTaskTitle={updateTaskTitle}
                  />
                )}
              </div>
            )}

            {/* Other tasks */}
            {getFilteredTasks().filter(
              (task) =>
                !getOverdueTasks().includes(task) &&
                !getTodayTasks().includes(task) &&
                !getHabitTasks().includes(task),
            ).length > 0 && (
              <InboxkList
                tasks={getFilteredTasks().filter(
                  (task) =>
                    !getOverdueTasks().includes(task) &&
                    !getTodayTasks().includes(task) &&
                    !getHabitTasks().includes(task),
                )}
                toggleTaskCompletion={toggleTaskCompletion}
                updateTaskTitle={updateTaskTitle}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
