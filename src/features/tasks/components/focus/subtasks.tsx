import { Subtask } from '@/features/tasks/types';
import { Button } from '@/shared/components/ui/button';
import { PlusIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (subtaskId: string, isCompleted: boolean) => void;
  onEdit: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
  onAdd: (title: string) => void;
}

export function SubtaskList({
  subtasks = [],
  onToggle,
  onEdit,
  onDelete,
  onAdd,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const newSubtaskInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddSubtask = useCallback(() => {
    setIsAddingSubtask(true);
    // Focus the input field after rendering
    setTimeout(() => {
      newSubtaskInputRef.current?.focus();
    }, 0);
  }, []);

  const handleCreateSubtask = useCallback(() => {
    if (newSubtaskTitle.trim()) {
      onAdd(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
    setIsAddingSubtask(false);
  }, [newSubtaskTitle, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleCreateSubtask();
      } else if (e.key === 'Escape') {
        setIsAddingSubtask(false);
        setNewSubtaskTitle('');
      }
    },
    [handleCreateSubtask],
  );

  return (
    <div className="mb-4 px-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {subtasks.filter((s) => s.isCompleted).length}/{subtasks.length} completed
          </span>
        )}
      </div>

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="group flex items-baseline gap-2">
            <TaskCheckbox
              checked={subtask.isCompleted}
              onCheckedChange={(checked) => onToggle(subtask.id, checked)}
              size="sm"
              className="mt-0.5"
              ariaLabel={`Toggle subtask: ${subtask.title}`}
            />
            <div className="flex-1">
              <input
                type="text"
                value={subtask.title}
                onChange={(e) => onEdit(subtask.id, e.target.value)}
                className={`w-full bg-transparent text-sm font-medium focus:outline-none ${
                  subtask.isCompleted ? 'text-muted-foreground line-through' : ''
                }`}
              />
            </div>
            <button
              onClick={() => onDelete(subtask.id)}
              className="invisible text-xs text-muted-foreground opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
              aria-label="Delete subtask"
            >
              ×
            </button>
          </div>
        ))}

        {isAddingSubtask ? (
          <div className="flex items-center gap-2">
            <div className="ml-6 flex-1">
              <input
                ref={newSubtaskInputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleCreateSubtask}
                placeholder="New subtask..."
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddSubtask}
            className="mt-1 flex w-full items-center justify-start gap-1 px-2 text-xs text-muted-foreground"
          >
            <PlusIcon className="h-3 w-3" />
            Add subtask
          </Button>
        )}
      </div>
    </div>
  );
}
