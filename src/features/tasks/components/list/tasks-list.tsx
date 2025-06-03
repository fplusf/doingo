import { resetForm } from '@/features/tasks/stores/task-form.store';
import {
  createNewTask,
  editExistingTask,
  getDefaultEndTime,
  getDefaultStartTime,
  getTasksByDate,
  highlightTask,
  setEditingTaskId,
  setSelectedDate,
  tasksStore,
  updateTask,
  updateTaskBreak,
} from '@/features/tasks/stores/tasks.store';
import {
  OptimalTask,
  RepetitionOption,
  RepetitionType,
  TaskCategory,
  TaskPriority,
} from '@/features/tasks/types/task.types';
import { batchPredictTaskProperties } from '@/lib/groq-service';
import { hasTimeOverlap } from '@/lib/task-utils';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { format, parse } from 'date-fns';
import React, { ForwardedRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TasksRoute } from '../../../../routes/routes';
import { processTasksWithGaps } from '../../utils/task-list-utils';
import { TaskDialog } from '../schedule/dialog';
import { TaskMoveToast } from './task-move-toast';
import { TasksContainer } from './tasks-container';
import { TimelineTaskItemOverlay } from './timeline-task-item-overlay';

interface DayContainerProps {
  // Props if any
}

// Export the handle interface
export interface TasksListHandle {
  setIsCreating: (value: boolean) => void;
}

export const TasksList = React.forwardRef<TasksListHandle, DayContainerProps>(
  (props, ref: ForwardedRef<TasksListHandle>) => {
    // Added explicit type for ref
    const allTasks = useStore(tasksStore, (state) => state.tasks);
    const selectedDate = useStore(tasksStore, (state) => state.selectedDate);
    const editingTaskId = useStore(tasksStore, (state) => state.editingTaskId);
    const highlightedTaskId = useStore(tasksStore, (state) => state.highlightedTaskId);
    const focusedTaskId = useStore(tasksStore, (state) => state.focusedTaskId);
    const search = useSearch({ from: TasksRoute.fullPath });

    // State hooks...
    const [isCreating, setIsCreating] = useState(false);
    const [activeCategory, setActiveCategory] = useState<TaskCategory>('work');
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [startTime, setStartTime] = useState(getDefaultStartTime());
    const [endTime, setEndTime] = useState(getDefaultEndTime());
    const [duration, setDuration] = useState<number>(45 * 60 * 1000);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [dueTime, setDueTime] = useState<string>('');
    const [newTask, setNewTask] = useState({
      title: '',
      emoji: '',
      priority: 'none' as TaskPriority,
      category: 'work' as TaskCategory,
    });
    const [showMoveToast, setShowMoveToast] = useState(false);
    const [movedTaskInfo, setMovedTaskInfo] = useState<{
      title: string;
      id: string;
      destinationDate: string | null;
    }>({ title: '', id: '', destinationDate: null });

    // Add state for active drag item
    const [activeDragTask, setActiveDragTask] = useState<OptimalTask | null>(null);

    const prevTasksRef = useRef<OptimalTask[]>([]);
    const navigate = useNavigate();
    const tasksRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    // Store previous tasks positions to calculate animation
    const taskPositionsRef = useRef<Map<string, DOMRect>>(new Map());

    // Effects for date changes, highlighting, keydown...
    React.useEffect(() => {
      if (search.date && search.date !== selectedDate) {
        setSelectedDate(search.date);
      }
    }, [search.date, selectedDate]);

    const basicTasks = React.useMemo(() => {
      return getTasksByDate(selectedDate);
    }, [selectedDate, allTasks]);

    // Memoize tasks with gaps based on the *basicTasks* derived from the current date
    const tasksWithGaps = React.useMemo(() => {
      return processTasksWithGaps(basicTasks);
    }, [basicTasks]);

    // Memoize tasksByCategory based on tasksWithGaps
    const tasksByCategory = React.useMemo(() => {
      const sortedTasks = tasksWithGaps; // Already processed with gaps
      const overlaps = new Map<string, boolean>();
      const realTasks = sortedTasks.filter((task) => !task.isGap);
      realTasks.forEach((task, index) => {
        if (index < realTasks.length - 1) {
          overlaps.set(task.id, hasTimeOverlap(task, realTasks[index + 1]));
        }
      });
      return { tasks: sortedTasks, overlaps };
    }, [tasksWithGaps, tasksStore.state.lastUpdate]);

    // Capture current positions of task elements before update
    const captureTaskPositions = () => {
      const positions = new Map<string, DOMRect>();

      if (tasksRef.current) {
        // Find all task elements (not gap elements)
        const taskElements = tasksRef.current.querySelectorAll('[data-task-id]');
        taskElements.forEach((el) => {
          const taskId = el.getAttribute('data-task-id');
          if (taskId && !taskId.includes('gap-')) {
            positions.set(taskId, el.getBoundingClientRect());
          }
        });
      }

      return positions;
    };

    // Capture positions after initial render
    useEffect(() => {
      taskPositionsRef.current = captureTaskPositions();
      console.log('STORE::: ', tasksStore.state);
    }, []);

    // TODO: The animation messes up with the timeline connector
    // Use layout effect to run GSAP animations when tasks change
    // useLayoutEffect(() => {
    //   // If a resize just finished, skip animation for this cycle and reset the flag
    //   if (tasksStore.state.justFinishedResizing) {
    //     tasksStore.setState((state) => ({ ...state, justFinishedResizing: false }));
    //     taskPositionsRef.current = captureTaskPositions(); // Update positions
    //     return; // Skip animation
    //   }

    //   // Skip animation if a resize is currently in progress
    //   if (tasksStore.state.isResizingTask) return;

    //   // Skip animation on initial render
    //   if (prevTasksRef.current.length === 0) return;

    //   // Capture current positions after render
    //   const prevPositions = taskPositionsRef.current;
    //   const currentPositions = captureTaskPositions();

    //   // Store current positions for next update
    //   taskPositionsRef.current = currentPositions;

    //   // Find elements that need to be animated
    //   if (tasksRef.current) {
    //     const taskElements = tasksRef.current.querySelectorAll('[data-task-id]');

    //     // Animate each task element
    //     taskElements.forEach((el) => {
    //       const taskId = el.getAttribute('data-task-id');
    //       if (!taskId || taskId.includes('gap-')) return;

    //       const prevRect = prevPositions.get(taskId);
    //       const currentRect = currentPositions.get(taskId);

    //       // Only animate if we have both positions and they're different
    //       if (prevRect && currentRect) {
    //         const deltaY = prevRect.top - currentRect.top;

    //         if (Math.abs(deltaY) > 5) {
    //           // Only animate noticeable changes
    //           // Set initial position
    //           gsap.set(el, { y: deltaY });

    //           // Animate to final position
    //           gsap.to(el, {
    //             y: 0,
    //             duration: 0.5,
    //             ease: 'power2.out',
    //             onComplete: () => {
    //               // Clean up
    //               gsap.set(el, { clearProps: 'y' });
    //             },
    //           });
    //         }
    //       }
    //     });
    //   }
    // }, [tasksWithGaps]);

    const handleAddBreak = (taskId: string, startTime: Date, durationInMs: number) => {
      updateTaskBreak(taskId, startTime, durationInMs, 'after');
    };

    // Effect for detecting date changes on edit...
    React.useEffect(() => {
      if (editingTaskId) {
        const currentTask = allTasks.find((task) => task.id === editingTaskId);
        const prevTask = prevTasksRef.current.find((task) => task.id === editingTaskId);
        if (currentTask && prevTask) {
          const currentDateStr = currentTask.taskDate
            ? format(new Date(currentTask.taskDate), 'yyyy-MM-dd')
            : null;
          const prevDateStr = prevTask.taskDate
            ? format(new Date(prevTask.taskDate), 'yyyy-MM-dd')
            : null;
          if (
            currentDateStr &&
            prevDateStr &&
            currentDateStr !== prevDateStr &&
            prevDateStr === selectedDate
          ) {
            setMovedTaskInfo({
              title: currentTask.title || 'Task',
              id: currentTask.id,
              destinationDate: currentDateStr,
            });
            setShowMoveToast(true);
          }
        }
      }
      prevTasksRef.current = [...allTasks];
    }, [allTasks, editingTaskId, selectedDate]);

    // Effect for highlighting after navigation...
    React.useEffect(() => {
      if (movedTaskInfo.id && movedTaskInfo.destinationDate === selectedDate) {
        highlightTask(movedTaskInfo.id);
        setMovedTaskInfo({ title: '', id: '', destinationDate: null });
      }
    }, [selectedDate, movedTaskInfo]);

    // Effect for keyboard shortcut...
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F') navigate({ to: '..' });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // Effect to scroll focused task into view
    React.useEffect(() => {
      // Skip if no focused task or missing refs
      if (!focusedTaskId || !viewportRef.current || !tasksRef.current) return;

      // Wait a bit for the DOM to be ready
      const timeoutId = setTimeout(() => {
        // Find the focused task element
        const taskElement = tasksRef.current?.querySelector(`[data-task-id="${focusedTaskId}"]`);
        const viewport = viewportRef.current;

        if (!taskElement || !viewport) {
          console.log('Focused task element or viewport not found:', focusedTaskId);
          return;
        }

        // Get viewport dimensions
        const viewportRect = viewport.getBoundingClientRect();
        const taskRect = taskElement.getBoundingClientRect();

        // Calculate the scroll position to center the task
        const scrollTop =
          viewport.scrollTop +
          (taskRect.top - viewportRect.top) -
          (viewportRect.height - taskRect.height) / 2;

        // Smooth scroll to the calculated position
        viewport.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        });
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timeoutId);
    }, [focusedTaskId, selectedDate]);

    // Expose imperative handle...
    React.useImperativeHandle(ref, () => ({
      setIsCreating: (value: boolean) => {
        setIsCreating(value);
        if (value) {
          resetForm();
          setNewTask({ title: '', emoji: '', priority: 'none', category: 'work' });
          setStartTime(getDefaultStartTime());
          setEndTime(getDefaultEndTime());
          setDuration(45 * 60 * 1000);
          setDueDate(undefined);
          setDueTime('');
          setActiveCategory('work');
        }
      },
    }));

    // Effect to update end time (ensure safety)...
    useEffect(() => {
      if (startTime) {
        try {
          const start = parse(startTime, 'HH:mm', new Date());
          if (!isNaN(start.getTime())) {
            // Check if parsing was successful
            const end = new Date(start.getTime() + duration);
            setEndTime(format(end, 'HH:mm'));
          } else {
            console.error('Invalid start time format:', startTime);
            // Set a default or handle error
          }
        } catch (error) {
          console.error('Error parsing start time:', error);
        }
      }
    }, [startTime, duration]);

    // Event handlers...
    const handleStartEdit = (task: OptimalTask) => {
      if (task.isGap) return;
      setEditingTask(task.id);
      setEditingTaskId(task.id);
    };

    const handleAddTask = (gapStartTime?: Date) => {
      // Renamed for clarity
      resetForm();
      setNewTask({ title: '', emoji: '', priority: 'none', category: 'work' });
      const startTimeToSet = gapStartTime ? format(gapStartTime, 'HH:mm') : getDefaultStartTime();
      setStartTime(startTimeToSet);
      const startDate = gapStartTime || parse(getDefaultStartTime(), 'HH:mm', new Date());
      const endTimeDate = new Date(startDate.getTime() + 45 * 60 * 1000); // Use 45 mins
      setEndTime(format(endTimeDate, 'HH:mm'));
      setDuration(45 * 60 * 1000); // Set duration state
      setDueDate(undefined);
      setDueTime('');
      setIsCreating(true);
      setActiveCategory('work');
    };

    // Add handler for drag start
    const handleDragStart = (event: DragStartEvent) => {
      const { active } = event;
      const draggedTaskId = active.id.toString();

      // Find the task being dragged
      const draggedTask = tasksByCategory.tasks.find((task) => task.id === draggedTaskId);

      // Set it as the active drag task
      if (draggedTask) {
        setActiveDragTask(draggedTask);
      }
    };

    // Add handler for drag end (keeps existing functionality, just clears active task)
    const handleDragEnd = (event: DragEndEvent) => {
      // Clear active drag task
      setActiveDragTask(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Use the current tasks from the memoized state, including gaps
      const currentTasksWithGaps = tasksByCategory.tasks;

      const oldIndex = currentTasksWithGaps.findIndex((task) => task.id === active.id);
      const newIndex = currentTasksWithGaps.findIndex((task) => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const movedTask = currentTasksWithGaps[oldIndex];
      const targetTask = currentTasksWithGaps[newIndex];

      // Prevent dragging over or involving gap items
      if (movedTask.isGap || targetTask.isGap) return;

      // 1. Determine the affected range in the current list (with gaps)
      const startIdx = Math.min(oldIndex, newIndex);
      const endIdx = Math.max(oldIndex, newIndex);

      // 2. Find the *original* start time of the block
      //    This is the startTime of the task currently at startIdx
      const anchorTask = currentTasksWithGaps[startIdx];
      // Ensure anchorTask and its startTime exist, provide a robust fallback
      const anchorStartTime = anchorTask?.startTime ? new Date(anchorTask.startTime) : new Date();

      // 3. Perform the array move on a copy of the current list (with gaps)
      let reorderedTasksWithGaps = arrayMove([...currentTasksWithGaps], oldIndex, newIndex);

      // 4. Recalculate times sequentially within the affected block
      let currentTimeCursor = new Date(anchorStartTime); // Use a copy for the cursor
      const finalTasksWithGaps = reorderedTasksWithGaps.map((task, index) => {
        // Only modify tasks within the affected block range
        if (index >= startIdx && index <= endIdx) {
          const updatedTask = { ...task };
          const taskDuration = task.duration || 0; // Handle potentially missing duration

          updatedTask.startTime = new Date(currentTimeCursor); // Assign current cursor time
          const endTime = new Date(currentTimeCursor.getTime() + taskDuration);
          updatedTask.nextStartTime = endTime; // Update next start time (end of current task)

          // Correctly format the time string with both start and end times
          updatedTask.time = `${format(updatedTask.startTime, 'HH:mm')}—${format(endTime, 'HH:mm')}`;

          currentTimeCursor = endTime; // Advance the cursor for the next task

          return updatedTask;
        }
        // Keep tasks outside the range unchanged
        return task;
      });

      // 5. Update the main task store
      tasksStore.setState((state) => {
        // Map over the *original* state.tasks (core tasks without gaps)
        const updatedCoreTasks = state.tasks.map((coreTask) => {
          // Find the corresponding task in our *fully processed* finalTasks list
          const processedVersion = finalTasksWithGaps.find(
            (finalTask) => finalTask.id === coreTask.id,
          );
          // If found (and it's not a gap itself), return the processed version
          // Otherwise, keep the original core task
          return processedVersion && !processedVersion.isGap ? processedVersion : coreTask;
        });
        return { ...state, tasks: updatedCoreTasks };
      });
    };

    // Handle priority prediction requests from dialog
    const handlePriorityPrediction = async (
      taskData: { taskId?: string; title: string },
      callback: (priority: TaskPriority, emoji?: string) => void,
    ) => {
      const { taskId, title } = taskData;

      if (!title || title.trim().length < 3) {
        console.log('Title too short for priority prediction');
        callback('none'); // Always call callback even for invalid data
        return;
      }

      // Store taskId for tasks being edited - needed in case dialog closes during prediction
      const currentEditingTaskId = taskId || editingTaskId;

      console.log(
        `Parent component handling priority prediction for: "${title}" (taskId: ${currentEditingTaskId || 'new task'})`,
      );

      try {
        // Make the API call to predict properties
        const { priority: predictedPriority, emoji: predictedEmoji } =
          await batchPredictTaskProperties(title);
        console.log('Received predictions in parent:', { predictedPriority, predictedEmoji });

        // If we have a task ID, update the existing task
        if (currentEditingTaskId) {
          console.log(`Updating task ${currentEditingTaskId} with priority ${predictedPriority}`);

          // GUARD: Validate that we have meaningful data before updating
          // Don't update the task store with potentially corrupted AI predictions
          const hasValidPriority =
            predictedPriority && ['high', 'medium', 'low', 'none'].includes(predictedPriority);
          const hasValidEmoji = predictedEmoji && predictedEmoji.trim().length > 0;

          if (hasValidPriority || hasValidEmoji) {
            const updateData: Partial<OptimalTask> = {};
            if (hasValidPriority) updateData.priority = predictedPriority;
            if (hasValidEmoji) updateData.emoji = predictedEmoji;

            // Update the task in the store - this will affect the UI even if dialog is closed
            updateTask(currentEditingTaskId, updateData);

            // Find the task in the basic tasks (without gaps) to confirm update
            const updatedTask = basicTasks.find((t) => t.id === currentEditingTaskId);
            if (updatedTask) {
              console.log('Task found and updated in store:', updatedTask.id);
            } else {
              console.warn('Task not found in basic tasks after update. This might be a new task.');
            }
          } else {
            console.warn('Skipping task update - invalid AI prediction data:', {
              predictedPriority,
              predictedEmoji,
            });
          }
        } else {
          // For new tasks, update the newTask state for future dialog opens
          console.log('Setting properties for new task:', { predictedPriority, predictedEmoji });
          setNewTask((prev) => ({
            ...prev,
            priority: predictedPriority,
            emoji: predictedEmoji,
          }));
        }

        // Always call the callback with the predictions
        callback(predictedPriority, predictedEmoji);
      } catch (error) {
        console.error('Error in property prediction:', error);
        callback('none', '📝'); // Use defaults on error
      }
    };

    // --- Component Return (JSX) ---
    return (
      <ScrollArea viewportRef={viewportRef} className="relative h-full w-full">
        <div ref={tasksRef} className="relative mx-auto w-full max-w-[900px] px-10 pb-16">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div className="relative">
              <SortableContext
                items={tasksByCategory.tasks.map((task) => task.id)} // Use IDs from tasksWithGaps
                strategy={verticalListSortingStrategy}
              >
                <TasksContainer
                  category={activeCategory}
                  tasks={tasksByCategory.tasks}
                  onEditTask={handleStartEdit}
                  onAddTask={handleAddTask}
                  onAddBreak={handleAddBreak}
                  overlaps={tasksByCategory.overlaps}
                  highlightedTaskId={highlightedTaskId}
                />
              </SortableContext>
            </div>

            {/* Add DragOverlay with TimelineTaskItemOverlay */}
            {createPortal(
              <DragOverlay
                zIndex={1000}
                dropAnimation={null}
                adjustScale={false}
                modifiers={[]} // No modifiers to avoid interfering with our custom positioning
              >
                {activeDragTask ? <TimelineTaskItemOverlay task={activeDragTask} /> : null}
              </DragOverlay>,
              document.body,
            )}
          </DndContext>
        </div>

        {/* Dialogs and Toast */}
        <TaskDialog
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) setIsCreating(false);
          }}
          mode="create"
          initialValues={{
            startTime: startTime, // Use state for initial time
            dueTime: dueTime,
            duration: duration, // Use state for initial duration
            dueDate: dueDate, // Use state for initial due date
            priority: newTask.priority,
            category: newTask.category,
            subtasks: [],
            repetition: 'once',
          }}
          onSubmit={(values) => {
            // Convert the simple string repetition to RepetitionOption object
            const formValues = {
              ...values,
              repetition: {
                type:
                  values.repetition === 'custom' ? 'once' : (values.repetition as RepetitionType),
                repeatInterval: 1,
              } as RepetitionOption,
            };
            createNewTask(formValues);
            setIsCreating(false);
          }}
          onRequestPriorityPrediction={handlePriorityPrediction}
        />

        {editingTask && (
          <TaskDialog
            open={!!editingTask}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTask(null);
                setEditingTaskId(null);
              }
            }}
            mode="edit"
            initialValues={(() => {
              const task = basicTasks.find((t) => t.id === editingTask);
              if (!task) return {};

              // Map RepetitionType to TaskFormValues repetition string
              let repetitionValue: 'once' | 'daily' | 'weekly' | 'custom' = 'once';
              if (task.repetition?.type) {
                if (
                  task.repetition.type === 'once' ||
                  task.repetition.type === 'daily' ||
                  task.repetition.type === 'weekly'
                ) {
                  repetitionValue = task.repetition.type;
                } else {
                  repetitionValue = 'custom';
                }
              }

              // Populate initial values from the found task
              return {
                title: task.title || '',
                emoji: task.emoji || '',
                startTime: task.time?.split('—')[0] || '',
                dueTime: task.dueTime || '',
                duration: task.duration || 45 * 60 * 1000,
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Ensure Date object
                priority: task.priority || 'none',
                category: task.category || 'work',
                notes: task.notes || '',
                subtasks: task.subtasks || [],
                progress: task.progress || 0,
                repetition: repetitionValue,
              };
            })()}
            onSubmit={(values) => {
              const taskToEdit = basicTasks.find((t) => t.id === editingTask);
              if (taskToEdit) {
                // Convert form values to proper RepetitionOption
                const formValues = {
                  ...values,
                  repetition: {
                    type:
                      values.repetition === 'custom'
                        ? 'once'
                        : (values.repetition as RepetitionType),
                    repeatInterval: taskToEdit.repetition?.repeatInterval || 1,
                    repeatStartDate: taskToEdit.repetition?.repeatStartDate,
                    repeatEndDate: taskToEdit.repetition?.repeatEndDate,
                  } as RepetitionOption,
                };
                editExistingTask(taskToEdit, formValues);
              }
              setEditingTask(null);
              setEditingTaskId(null);
            }}
            onRequestPriorityPrediction={handlePriorityPrediction}
          />
        )}

        <TaskMoveToast
          isOpen={showMoveToast}
          onOpenChange={setShowMoveToast}
          taskTitle={movedTaskInfo.title}
          destinationDate={movedTaskInfo.destinationDate}
          onViewClick={() => {
            if (movedTaskInfo.id && movedTaskInfo.destinationDate) {
              navigate({
                to: '/tasks',
                search: { date: movedTaskInfo.destinationDate, highlight: movedTaskInfo.id },
              });
              // Reset toast info after initiating navigation
              setMovedTaskInfo({ title: '', id: '', destinationDate: null });
              setShowMoveToast(false);
            }
            // Close edit dialog if open
            if (editingTask) {
              setEditingTask(null);
              setEditingTaskId(null);
            }
          }}
        />
      </ScrollArea>
    );
  },
);
