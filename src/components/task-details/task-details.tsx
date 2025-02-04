import { TaskScheduler } from '@/components/focus-calendar/task-scheduler';
import { convertTaskToSchedulerProps } from '@/lib/task-utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import React from 'react';
import TaskNotes from './task-notes';
import { EmojiPicker } from '@/components/emoji/emoji-picker';
import { Task } from '@/store/tasks.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';

interface TaskDetailsProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskDetails({ task, onEdit }: TaskDetailsProps) {
  console.count('Details rendered');
  const navigate = useNavigate();
  const [notes, setNotes] = React.useState(task.notes || '');
  const search = useSearch({ from: '/tasks/$taskId' });
  const schedulerProps = convertTaskToSchedulerProps(task);
  const currentTab = search.tab || 'document';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({ to: '..' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="space-y-8 rounded-xl shadow-sm backdrop-blur-sm">
        <Tabs value={currentTab} className="w-full">
          <TabsContent value="document">
            {/* Schedule Information */}
            <div className="mb-8 flex">
              <div className="flex-1">
                <EmojiPicker
                  emoji={task.emoji}
                  onEmojiSelect={(emoji) => onEdit({ ...task, emoji })}
                  className="text-3xl"
                />
              </div>
              <TaskScheduler
                startTime={schedulerProps.startTime}
                duration={schedulerProps.duration}
                startDate={schedulerProps.startDate}
                className="flex-1 text-muted-foreground"
              />
            </div>

            {/* Header */}
            <div className="flex items-start gap-4">
              <textarea
                placeholder="Task Title"
                value={task.title}
                onChange={(e) => {
                  onEdit({ ...task, title: e.target.value });
                  const target = e.target;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
                className="mb-2 w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold tracking-tight focus:outline-none"
                rows={1}
                style={{ height: 'auto' }}
                ref={(textareaRef) => {
                  if (textareaRef) {
                    textareaRef.style.height = 'auto';
                    textareaRef.style.height = `${textareaRef.scrollHeight}px`;
                  }
                }}
              />
            </div>

            {/* Notes */}
            <TaskNotes
              notes={notes}
              onNotesChange={(content) => {
                setNotes(content);
                onEdit({ ...task, notes: content });
              }}
            />
          </TabsContent>

          <TabsContent value="both">
            <Card>
              <CardHeader>
                <CardTitle>Split View</CardTitle>
                <CardDescription>See both document and canvas side by side.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="rounded border p-4">
                  <h3 className="mb-2 text-lg font-semibold">Document</h3>
                  <p>Your document content here.</p>
                </div>
                <div className="rounded border bg-gray-100 p-4">
                  <h3 className="mb-2 text-lg font-semibold">Canvas</h3>
                  <p>Your canvas content here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="canvas">
            <Card>
              <CardHeader>
                <CardTitle>Canvas View</CardTitle>
                <CardDescription>
                  Visualize and interact with your content on a canvas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[200px] items-center justify-center bg-gray-100">
                  <p>Your canvas content goes here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
