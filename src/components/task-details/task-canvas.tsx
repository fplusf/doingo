import { Suspense, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { Task } from '@/store/tasks.store';

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

export function TaskCanvas({ task }: TaskCanvasProps) {
  const { theme } = useTheme();
  const excalidrawWrapperRef = useRef<HTMLDivElement>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);

  useEffect(() => {
    const canvasData = localStorage.getItem('canvasData');
    if (excalidrawAPI && canvasData) {
      try {
        excalidrawAPI.updateScene(JSON.parse(canvasData));
      } catch (error) {
        console.error('Failed to parse canvas data:', error);
      }
    }

    return () => {
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({ elements: [] });
      }
    };
  }, []);

  const handleChange = debounce({ delay: 500 }, async () => {
    if (!excalidrawAPI) return;
    try {
      const sceneData = JSON.stringify(excalidrawAPI.getSceneElements());
      // updateTask(task.id, { canvasData: sceneData });
      localStorage.setItem('canvasData', sceneData);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
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
