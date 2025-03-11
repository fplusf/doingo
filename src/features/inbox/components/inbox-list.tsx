import type { Task } from '@/features/inbox/components/inbox-management-app';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface InboxListProps {
  tasks: Task[];
  toggleTaskCompletion: (taskId: string) => void;
  updateTaskTitle: (taskId: string, newTitle: string) => void;
}

export default function InboxkList({
  tasks,
  toggleTaskCompletion,
  updateTaskTitle,
}: InboxListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEditing = () => {
    if (editingTaskId) {
      updateTaskTitle(editingTaskId, editingTitle);
      setEditingTaskId(null);
    }
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50',
            task.completed && 'text-muted-foreground',
          )}
        >
          <div className="pt-0.5">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTaskCompletion(task.id)}
              className={cn(
                task.priority === 'high' && 'border-red-500',
                task.completed && 'opacity-50',
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            {editingTaskId === task.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={saveEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveEditing();
                  } else if (e.key === 'Escape') {
                    setEditingTaskId(null);
                  }
                }}
                autoFocus
                className="h-7 py-1"
              />
            ) : (
              <div
                className={cn(
                  'cursor-pointer text-sm font-medium',
                  task.completed && 'line-through',
                )}
                onClick={() => startEditing(task)}
              >
                {task.title}
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="h-5 py-0 text-xs">
                    {tag === 'random' && (
                      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
                        random
                      </span>
                    )}
                    {tag === 'optimal-adhd' && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        <span className="text-[10px] text-blue-500">Optimal ADHD</span>
                      </span>
                    )}
                    {tag === 'welcome' && (
                      <span className="flex items-center gap-1">
                        <span className="text-[10px] text-yellow-500">👋 Welcome</span>
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {task.dueDate && (
            <div className="whitespace-nowrap text-xs text-muted-foreground">{task.dueDate}</div>
          )}

          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
