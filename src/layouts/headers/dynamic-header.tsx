import { useMatches } from '@tanstack/react-router';
import { DefaultHeader } from './default-header';
import { DragWindowRegion, DragWindowRegionChildren } from '../../components/drag-window-region';

export function DynamicHeader() {
  const matches = useMatches();

  // Find the deepest match that has a headerConfig
  const routeHeader = [...matches].reverse().find((match) => match.__routeContext?.headerConfig)
    ?.__routeContext?.headerConfig;

  if (routeHeader) {
    return <DragWindowRegion>{routeHeader as DragWindowRegionChildren}</DragWindowRegion>;
  }

  return <DefaultHeader />;
}
