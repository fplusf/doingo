import { closeWindow, maximizeWindow, minimizeWindow } from '@/helpers/window_helpers';
import { type ReactNode } from 'react';
import { TopSidebarTriggerVisible } from './sidebar/left-sidebar-trigger';

export interface DragWindowRegionChildren {
  left: () => ReactNode;
  center: () => ReactNode;
  right: () => ReactNode;
}
interface DragWindowRegionProps {
  title?: ReactNode;
  children?: DragWindowRegionChildren;
}

export function DragWindowRegion({ children }: { children: DragWindowRegionChildren }) {
  return (
    <div className="fixed inset-0 flex h-12 w-screen flex-col items-stretch justify-between bg-sidebar">
      {/* Draggable background layer */}
      <div className="draglayer absolute inset-0" />

      {/* Content layer with three sections */}
      <div className="z-12 relative flex h-12 w-full items-center justify-between bg-sidebar">
        {/* Left section - fixed width */}
        <div className="no-drag flex min-w-[200px] items-center gap-2 px-4 pl-20">
          <TopSidebarTriggerVisible className="mt-2" />
          {children.left()}
        </div>

        {/* Center section - draggable unless content exists */}
        <div className="flex flex-1 items-center justify-center">
          {children.center ? (
            <div className="no-drag">{children.center()}</div>
          ) : (
            <div className="draglayer h-full w-full" />
          )}
        </div>

        {/* Right section - fixed width */}
        <div className="no-drag flex min-w-[200px] items-center justify-end gap-2 px-4">
          {children.right()}
        </div>
      </div>
    </div>
  );
}

export function WindowButtons() {
  return (
    <div className="flex">
      <button
        title="Minimize"
        type="button"
        className="p-2 hover:bg-slate-300"
        onClick={minimizeWindow}
      >
        <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="p-2 hover:bg-slate-300"
        onClick={maximizeWindow}
      >
        <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
          <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor"></rect>
        </svg>
      </button>
      <button type="button" title="Close" className="p-2 hover:bg-red-300" onClick={closeWindow}>
        <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
    </div>
  );
}
