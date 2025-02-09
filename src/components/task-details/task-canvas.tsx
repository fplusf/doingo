import { Suspense, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

// const ExcalidrawWrapper = React.lazy<ExcalidrawProps>(() =>
//   import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })),
// );

export function TaskCanvas() {
  const { theme } = useTheme();
  const excalidrawWrapperRef = useRef<HTMLDivElement>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);

  useEffect(() => {
    excalidrawAPI?.updateScene;
  }, [excalidrawAPI]);

  return (
    <div className="flex h-full w-full flex-col">
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
          />
        </Suspense>
      </div>
    </div>
  );
}
