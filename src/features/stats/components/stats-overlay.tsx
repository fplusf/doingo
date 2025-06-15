import { Overlay } from '@/shared/components/ui/overlay';
import StatsOverview from './stats-overview';

export function StatsOverlay() {
  return (
    <Overlay>
      <StatsOverview />
    </Overlay>
  );
}
