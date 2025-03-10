import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarGrid from '../components/calendar-grid';

describe('CalendarGrid', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Test Event',
      start: new Date(2024, 2, 10, 10, 0),
      end: new Date(2024, 2, 10, 11, 0),
      color: 'blue' as const,
      description: '',
      completed: false,
    },
  ];

  const mockProps = {
    view: 'week' as const,
    currentDate: new Date(2024, 2, 10), // March 10, 2024
    events: mockEvents,
    onEventClick: vi.fn(),
    onTimeSlotClick: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    isDragging: false,
    draggedEvent: null,
    onEventResize: vi.fn(),
  };

  it('renders week view with correct Google Calendar styling', () => {
    const { container } = render(<CalendarGrid {...mockProps} />);

    // Check time column styling
    const timeColumn = container.querySelector('.absolute.left-0.top-0.z-10');
    expect(timeColumn).toHaveClass('w-[60px]', 'border-r', 'border-[#3c4043]');

    // Check hour cells styling
    const hourCells = container.querySelectorAll('.h-[48px]');
    expect(hourCells.length).toBeGreaterThan(0);

    // Check grid lines
    const gridLines = container.querySelectorAll('.border-t.border-[#3c4043]');
    expect(gridLines.length).toBeGreaterThan(0);

    // Check half-hour lines
    const halfHourLines = container.querySelectorAll(
      '.border-t.border-dashed.border-[#3c4043].opacity-50',
    );
    expect(halfHourLines.length).toBeGreaterThan(0);
  });

  it('renders current time indicator correctly', () => {
    const { container } = render(<CalendarGrid {...mockProps} />);

    const timeIndicator = container.querySelector('.bg-red-500');
    expect(timeIndicator).toBeInTheDocument();
    expect(timeIndicator).toHaveClass('h-[2px]');
  });

  it('renders events in correct position', () => {
    render(<CalendarGrid {...mockProps} />);

    const eventElement = screen.getByText('Test Event');
    const eventContainer = eventElement.closest('[style*="top"]');
    expect(eventContainer).toHaveStyle({ top: '480px' }); // 10:00 AM = 10 * 48px
  });

  it('handles time slot clicks', () => {
    const { container } = render(<CalendarGrid {...mockProps} />);

    const timeSlot = container.querySelector('.cursor-pointer');
    if (timeSlot) {
      fireEvent.click(timeSlot);
      expect(mockProps.onTimeSlotClick).toHaveBeenCalled();
    }
  });

  it('shows correct time labels', () => {
    render(<CalendarGrid {...mockProps} />);

    // Check for specific time labels (e.g., 9 AM, 10 AM)
    expect(screen.getByText('9 AM')).toBeInTheDocument();
    expect(screen.getByText('10 AM')).toBeInTheDocument();
  });
});
