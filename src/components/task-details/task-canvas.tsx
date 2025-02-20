import { Suspense, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { Task } from '@/store/tasks.store';
import { useSearch } from '@tanstack/react-router';

interface TaskCanvasProps {
  task: Task;
}

function debounce({ delay }: { delay: number }, fn: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

const getCanvasKey = (taskId: string) => `canvas_${taskId}`;

export function TaskCanvas({ task }: TaskCanvasProps) {
  const { theme } = useTheme();
  const excalidrawWrapperRef = useRef<HTMLDivElement>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const { tab } = useSearch({ from: '/tasks/$taskId' });

  useEffect(() => {
    if (!task.id || !excalidrawAPI) return;

    const canvasKey = getCanvasKey(task.id);
    const canvasData = localStorage.getItem(canvasKey);
    let sceneData = null;

    if (canvasData) {
      try {
        sceneData = JSON.parse(canvasData);
      } catch (error) {
        console.error(`Failed to parse canvas data for task ${task.id}:`, error);
        localStorage.removeItem(canvasKey);
      }
    }

    if (sceneData) {
      const { elements } = sceneData;
      // Use a small timeout to ensure the canvas is ready
      setTimeout(() => {
        excalidrawAPI.updateScene({
          elements,
        });
        excalidrawAPI.scrollToContent(undefined, {
          animate: true,
          duration: 500,
        });
      }, 100);
    }

    if (tab === 'canvas') {
      excalidrawAPI.scrollToContent(undefined, {
        animate: true,
        duration: 500,
      });
    }

    // Don't clear the scene on unmount as it causes the flickering
  }, [excalidrawAPI, task.id, tab]);

  const handleChange = debounce({ delay: 1000 }, () => {
    if (!excalidrawAPI || !task.id) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      // Only save if there are actual changes
      if (elements.length > 0) {
        const sceneData = JSON.stringify({
          elements,
        });
        const canvasKey = getCanvasKey(task.id);
        localStorage.setItem(canvasKey, sceneData);
      }
    } catch (error) {
      console.error(`Failed to save canvas data for task ${task.id}:`, error);
    }
  });

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div ref={excalidrawWrapperRef} className="relative w-full flex-1">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }
        >
          <Excalidraw
            viewModeEnabled={viewModeEnabled}
            zenModeEnabled={zenModeEnabled}
            gridModeEnabled={gridModeEnabled}
            theme={theme === 'dark' ? 'dark' : 'light'}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: false,
                export: false,
                loadScene: false,
                saveToActiveFile: false,
                saveAsImage: false,
              },
            }}
            excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
            onChange={handleChange}
          />
        </Suspense>
      </div>
    </div>
  );
}
