import { CategoryBadge } from '@/features/tasks/components/timeline/category-badge';
import { TIMELINE_CATEGORIES, TimelineItem } from '@/features/tasks/components/timeline/timeline';
import { toggleTaskCompletion, updateTask } from '@/features/tasks/store/tasks.store';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { CategorySectionProps } from '../../types';
import { SortableTaskItem } from '../list/sortable-task-item';
import { TaskCard } from '../list/task-card';

export const CategorySection = ({
  category,
  tasks,
  onAddTask,
  onEditTask,
}: CategorySectionProps) => {
  return (
    <div className="relative mb-16 min-h-8" id={`category-${category}`}>
      <CategoryBadge
        id={`category-${category}`}
        label={TIMELINE_CATEGORIES[category].label}
        color={TIMELINE_CATEGORIES[category].color}
        isSticky
      />
      <div className="relative mt-4">
        {/* Task Cards with Timeline Items */}
        <div className="flex flex-col gap-y-3 space-y-0">
          {tasks.map((task) => (
            <div key={task.id} data-id={task.id} className="relative">
              {/* Timeline Item */}
              <div className="absolute -top-1 left-2 -ml-4 w-full">
                <TimelineItem
                  dotColor={task.priority}
                  startTime={task.startTime}
                  nextStartTime={task.nextStartTime}
                  completed={task.completed}
                  strikethrough={task.completed}
                  onPriorityChange={(priority) => updateTask(task.id, { priority })}
                  onCompletedChange={() => toggleTaskCompletion(task.id)}
                />
              </div>

              {/* Task Card */}
              <SortableTaskItem task={task}>
                <div
                  className={cn(
                    'relative h-full',
                    (task.nextStartTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60) > 2
                      ? 'h-[140px] lg:h-[180px]'
                      : 'h-[100px] lg:h-[120px]',
                  )}
                >
                  <TaskCard task={task} onEdit={onEditTask} />
                </div>
              </SortableTaskItem>
            </div>
          ))}
          <Button
            onClick={onAddTask}
            variant="ghost"
            className="z-30 my-10 ml-16 w-[calc(100%-4rem)] justify-start gap-2 bg-transparent text-muted-foreground hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Add new task
          </Button>
        </div>
      </div>
    </div>
  );
};
