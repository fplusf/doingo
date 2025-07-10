import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { useSearch } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { OptimalTask } from '../../types';

// Lazy load Excalidraw to avoid SSR issues
const Excalidraw = React.lazy(() =>
  import('@excalidraw/excalidraw').then((module) => ({
    default: module.Excalidraw,
  })),
);

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
  }
}

// Set asset path for fonts (ensure it's set only in browser)
if (typeof window !== 'undefined') {
  window.EXCALIDRAW_ASSET_PATH = window.EXCALIDRAW_ASSET_PATH ?? '/';
}

interface TaskCanvasProps {
  task: OptimalTask;
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
  const { tab } = useSearch({ from: '/tasks' });

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
            initialData={{
              appState: {
                currentItemStrokeStyle: 'solid',
                currentItemEndArrowhead: 'triangle',
                currentItemRoughness: 2,
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
