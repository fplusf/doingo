import { fireEvent, render, screen } from '@testing-library/react';
import { addHours } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { VerticalTimeline } from './vertical-timeline';

describe('VerticalTimeline', () => {
  const startTime = new Date(2024, 0, 1, 9); // 9 AM
  const endTime = new Date(2024, 0, 1, 17); // 5 PM

  it('renders the correct number of hour blocks', () => {
    render(<VerticalTimeline startTime={startTime} endTime={endTime} />);

    // Should have 8 hour blocks (9 AM to 5 PM)
    const hourLabels = screen.getAllByText(/\d{1,2}:\d{2} [AP]M/);
    expect(hourLabels).toHaveLength(8);
  });

  it('displays time gaps for intervals greater than 3 hours', () => {
    const gappedEndTime = addHours(startTime, 6); // Create a 6-hour gap
    render(<VerticalTimeline startTime={startTime} endTime={gappedEndTime} />);

    const timeGaps = screen.getAllByText('Time gap');
    expect(timeGaps).toHaveLength(1);
  });

  it('calls onTimeClick when clicking an hour block', () => {
    const handleTimeClick = vi.fn();
    render(
      <VerticalTimeline startTime={startTime} endTime={endTime} onTimeClick={handleTimeClick} />,
    );

    const hourBlocks = screen.getAllByText(/\d{1,2}:\d{2} [AP]M/);
    fireEvent.click(hourBlocks[0].parentElement!);

    expect(handleTimeClick).toHaveBeenCalledTimes(1);
    expect(handleTimeClick).toHaveBeenCalledWith(startTime);
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-timeline';
    render(<VerticalTimeline startTime={startTime} endTime={endTime} className={customClass} />);

    const timeline = screen.getByRole('complementary');
    expect(timeline).toHaveClass(customClass);
  });
});
