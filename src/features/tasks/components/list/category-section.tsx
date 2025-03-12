import { CategoryBadge } from '@/features/tasks/components/timeline/category-badge';
import { TIMELINE_CATEGORIES } from '@/features/tasks/components/timeline/timeline';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { CategorySectionProps } from '../../types';
import { SortableTimelineTaskItem } from './sortable-timeline-task-item';

export const CategorySection = ({
  category,
  tasks,
  onAddTask,
  onEditTask,
  overlaps,
  highlightedTaskId,
}: CategorySectionProps) => {
  return (
    <div className="relative mb-16 min-h-8" id={`category-${category}`}>
      <CategoryBadge
        category={category}
        label={TIMELINE_CATEGORIES[category].label}
        color={TIMELINE_CATEGORIES[category].color}
        isSticky
      />
      <div className="relative mt-4">
        {/* Task Cards with Timeline Items */}
        <div className="flex flex-col gap-y-5 space-y-0">
          {tasks.map((task, index) => {
            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-3xl transition-colors duration-300',
                  highlightedTaskId === task.id && 'bg-muted ring-2 ring-border/50',
                )}
              >
                <SortableTimelineTaskItem
                  task={task}
                  onEdit={onEditTask}
                  isLastItem={index === tasks.length - 1}
                  nextTask={index < tasks.length - 1 ? tasks[index + 1] : undefined}
                  overlapsWithNext={overlaps.get(task.id) || false}
                />
              </div>
            );
          })}
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
