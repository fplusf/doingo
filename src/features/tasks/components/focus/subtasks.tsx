import { updateField } from '@/features/tasks/store/task-form.store';
import { Subtask } from '@/features/tasks/types/task.types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { v4 as uuidv4 } from 'uuid';
import { TaskCheckbox } from '../../../../shared/components/task-checkbox';

interface SubtaskListProps {
  subtasks: Subtask[];
  onSubtasksChange?: (subtasks: Subtask[]) => void;
  className?: string;
}

const SortableSubtaskItem = ({
  className,
  subtask,
  onToggle,
  onEdit,
  onDelete,
  onKeyDown,
  textareaRef,
}: {
  className?: string;
  subtask: Subtask;
  onToggle: (subtaskId: string, isCompleted: boolean) => void;
  onEdit: (subtaskId: string, title: string) => void;
  onDelete: (subtaskId: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, subtaskId: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group flex items-baseline gap-2', isDragging && 'opacity-70', className)}
    >
      <div
        {...attributes}
        {...listeners}
        className="invisible cursor-grab text-muted-foreground group-hover:visible"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <TaskCheckbox
        checked={subtask.isCompleted}
        onCheckedChange={(checked) => onToggle(subtask.id, checked)}
        size="md"
        className="mt-0.5"
        ariaLabel={`Toggle subtask: ${subtask.title}`}
      />
      <TextareaAutosize
        ref={textareaRef}
        value={subtask.title}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onEdit(subtask.id, e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => onKeyDown(e, subtask.id)}
        placeholder="Subtask description..."
        className={cn(
          'w-full resize-none bg-transparent text-sm font-medium text-foreground focus:outline-none',
          subtask.isCompleted && 'opacity-80',
        )}
        minRows={1}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="invisible h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDelete(subtask.id)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function SubtaskList({ subtasks = [], onSubtasksChange, className }: SubtaskListProps) {
  // Internal state for subtasks
  const [internalSubtasks, setInternalSubtasks] = useState<Subtask[]>([]);
  const [emptyFieldValue, setEmptyFieldValue] = useState('');
  const [lastAddedSubtaskId, setLastAddedSubtaskId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, React.RefObject<HTMLTextAreaElement>>>({});
  const emptyInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize internal state from props
  useEffect(() => {
    setInternalSubtasks(subtasks);
  }, [subtasks]);

  // Focus the last added subtask when it changes
  useEffect(() => {
    if (lastAddedSubtaskId && inputRefs.current[lastAddedSubtaskId]?.current) {
      inputRefs.current[lastAddedSubtaskId]?.current?.focus();
      setLastAddedSubtaskId(null); // Reset after focusing
    }
  }, [lastAddedSubtaskId, internalSubtasks]);

  // Helper to sort subtasks by order
  const sortedSubtasks = [...internalSubtasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Calculate progress percentage
  const calculateProgress = (tasks: Subtask[]): number => {
    const completedCount = tasks.filter((s) => s.isCompleted).length;
    return tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  };

  // Update the form store and notify parent component
  const updateSubtasks = useCallback(
    (newSubtasks: Subtask[]) => {
      setInternalSubtasks(newSubtasks);

      // Update form store
      const progress = calculateProgress(newSubtasks);
      updateField('subtasks', newSubtasks);
      updateField('progress', progress);

      // Notify parent component if callback provided
      if (onSubtasksChange) {
        onSubtasksChange(newSubtasks);
      }
    },
    [onSubtasksChange],
  );

  // Handler for toggling subtask completion
  const handleToggleSubtask = useCallback(
    (subtaskId: string, isCompleted: boolean) => {
      const updated = internalSubtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
      );
      updateSubtasks(updated);
    },
    [internalSubtasks, updateSubtasks],
  );

  // Handler for editing subtask title
  const handleEditSubtask = useCallback(
    (subtaskId: string, title: string) => {
      const updated = internalSubtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, title } : subtask,
      );
      updateSubtasks(updated);
    },
    [internalSubtasks, updateSubtasks],
  );

  // Handler for deleting subtask
  const handleDeleteSubtask = useCallback(
    (subtaskId: string) => {
      const updated = internalSubtasks.filter((subtask) => subtask.id !== subtaskId);
      updateSubtasks(updated);
    },
    [internalSubtasks, updateSubtasks],
  );

  // Function to insert a new empty subtask after a specific subtask
  const insertEmptySubtaskAfter = useCallback(
    (afterSubtaskId?: string) => {
      // If no subtasks exist or no ID specified, create the first subtask
      if (sortedSubtasks.length === 0 || !afterSubtaskId) {
        if (emptyFieldValue.trim()) {
          // Create a first subtask with current empty field value
          const newSubtask: Subtask = {
            id: uuidv4(),
            title: emptyFieldValue.trim(),
            isCompleted: false,
            order: 0,
          };

          // Create a second empty subtask after it
          const emptySubtaskId = uuidv4();
          const emptySubtask: Subtask = {
            id: emptySubtaskId,
            title: '',
            isCompleted: false,
            order: 1000,
          };

          // Create a ref for the new subtask
          inputRefs.current[emptySubtaskId] = React.createRef();

          updateSubtasks([newSubtask, emptySubtask]);
          setEmptyFieldValue('');

          // Set the ID of the subtask to focus
          setLastAddedSubtaskId(emptySubtaskId);
        } else {
          const newSubtaskId = uuidv4();
          const newSubtask: Subtask = {
            id: newSubtaskId,
            title: '',
            isCompleted: false,
            order: 0,
          };

          // Create a ref for the new subtask
          inputRefs.current[newSubtaskId] = React.createRef();

          updateSubtasks([newSubtask]);

          // Set the ID of the subtask to focus
          setLastAddedSubtaskId(newSubtaskId);
        }
        return;
      }

      // Find the index and order of the subtask to insert after
      const index = sortedSubtasks.findIndex((s) => s.id === afterSubtaskId);
      if (index === -1) return;

      const currentOrder = sortedSubtasks[index].order || 0;
      let nextOrder = 0;

      // If there's a next subtask, place the new one between current and next
      if (index < sortedSubtasks.length - 1) {
        const nextSubtask = sortedSubtasks[index + 1];
        nextOrder = ((currentOrder || 0) + (nextSubtask.order || 0)) / 2;
      } else {
        // Otherwise, place it after the current subtask
        nextOrder = currentOrder + 1000;
      }

      // Create a new empty subtask
      const newSubtaskId = uuidv4();
      const newSubtask: Subtask = {
        id: newSubtaskId,
        title: '',
        isCompleted: false,
        order: nextOrder,
      };

      // Create a ref for the new subtask
      inputRefs.current[newSubtaskId] = React.createRef();

      // Insert the new subtask at the correct position
      const updatedSubtasks = [...sortedSubtasks];
      updatedSubtasks.splice(index + 1, 0, newSubtask);

      // Update the form store
      updateSubtasks(updatedSubtasks);

      // Set the ID of the subtask to focus
      setLastAddedSubtaskId(newSubtaskId);
    },
    [sortedSubtasks, emptyFieldValue, updateSubtasks],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, subtaskId?: string) => {
      const textarea = e.target as HTMLTextAreaElement;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertEmptySubtaskAfter(subtaskId);
      } else if (
        subtaskId &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        textarea.value === ''
      ) {
        e.preventDefault();
        if (sortedSubtasks.length > 1) {
          const currentIndex = sortedSubtasks.findIndex((s) => s.id === subtaskId);

          // Determine which subtask to focus next (previous one)
          if (currentIndex > 0) {
            const prevSubtaskId = sortedSubtasks[currentIndex - 1].id;
            setLastAddedSubtaskId(prevSubtaskId);
          }

          handleDeleteSubtask(subtaskId);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Get current cursor position
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        const value = textarea.value;

        // Check if we're at the top or bottom of the textarea
        const isAtStart = selectionStart === 0 && selectionEnd === 0;
        const isAtEnd = selectionStart === value.length && selectionEnd === value.length;
        const isOnFirstLine = value.substring(0, selectionStart).indexOf('\n') === -1;
        const isOnLastLine = value.substring(selectionEnd).indexOf('\n') === -1;

        // Allow navigation between subtasks only if we're at the edges of the textarea content
        if ((e.key === 'ArrowUp' && isAtStart) || (e.key === 'ArrowUp' && isOnFirstLine)) {
          e.preventDefault();
          // Find the previous subtask
          if (subtaskId) {
            const currentIndex = sortedSubtasks.findIndex((s) => s.id === subtaskId);
            if (currentIndex > 0) {
              const prevSubtaskId = sortedSubtasks[currentIndex - 1].id;
              setLastAddedSubtaskId(prevSubtaskId);

              // Position cursor at the end of the previous textarea
              setTimeout(() => {
                const textarea = inputRefs.current[prevSubtaskId]?.current;
                if (textarea) {
                  const length = textarea.value.length;
                  textarea.setSelectionRange(length, length);
                }
              }, 0);
            }
          }
        } else if ((e.key === 'ArrowDown' && isAtEnd) || (e.key === 'ArrowDown' && isOnLastLine)) {
          e.preventDefault();
          // Find the next subtask
          if (subtaskId) {
            const currentIndex = sortedSubtasks.findIndex((s) => s.id === subtaskId);
            if (currentIndex < sortedSubtasks.length - 1) {
              const nextSubtaskId = sortedSubtasks[currentIndex + 1].id;
              setLastAddedSubtaskId(nextSubtaskId);

              // Position cursor at the beginning of the next textarea
              setTimeout(() => {
                const textarea = inputRefs.current[nextSubtaskId]?.current;
                if (textarea) {
                  textarea.setSelectionRange(0, 0);
                }
              }, 0);
            }
          }
        }
      }
    },
    [sortedSubtasks, handleDeleteSubtask, insertEmptySubtaskAfter],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSubtasks.findIndex((item) => item.id === active.id);
      const newIndex = sortedSubtasks.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sortedSubtasks, oldIndex, newIndex);

        // Update order values with gaps between them for future insertions
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index * 1000,
        }));

        // Update subtasks
        updateSubtasks(updatedItems);
      }
    }
  };

  // Handle the empty field value change
  const handleEmptyFieldChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmptyFieldValue(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Create initial subtask if none exist */}
      {sortedSubtasks.length === 0 && (
        <div className="flex items-center gap-2">
          <TaskCheckbox
            checked={false}
            onCheckedChange={() => {}}
            size="md"
            className="mt-0.5 opacity-50"
            ariaLabel="New subtask checkbox"
          />
          <TextareaAutosize
            ref={emptyInputRef}
            value={emptyFieldValue}
            onChange={handleEmptyFieldChange}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyDown(e)}
            onBlur={() => {
              if (emptyFieldValue.trim()) {
                // Create a subtask when the input loses focus if it has content
                const newSubtaskId = uuidv4();
                const newSubtask: Subtask = {
                  id: newSubtaskId,
                  title: emptyFieldValue.trim(),
                  isCompleted: false,
                  order: 0,
                };

                // Create a ref for the new subtask
                inputRefs.current[newSubtaskId] = React.createRef();

                updateSubtasks([newSubtask]);
                setEmptyFieldValue('');

                // Set the ID of the subtask to focus
                setLastAddedSubtaskId(newSubtaskId);
              }
            }}
            placeholder="Subtask description..."
            className="w-full resize-none bg-transparent text-sm font-medium text-foreground focus:outline-none"
            minRows={1}
            autoFocus
          />
        </div>
      )}

      {/* Existing subtasks with drag and drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={sortedSubtasks.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {sortedSubtasks.map((subtask) => {
              // Create a ref for this subtask if it doesn't exist
              if (!inputRefs.current[subtask.id]) {
                inputRefs.current[subtask.id] = React.createRef();
              }

              return (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={handleToggleSubtask}
                  onEdit={handleEditSubtask}
                  onDelete={handleDeleteSubtask}
                  onKeyDown={handleKeyDown}
                  textareaRef={inputRefs.current[subtask.id]}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
