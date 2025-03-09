import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventItem from '../event-item';

describe('EventItem', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    start: new Date(2024, 2, 10, 10, 0), // 10:00 AM
    end: new Date(2024, 2, 10, 11, 0), // 11:00 AM
    color: 'blue' as const,
    completed: false,
  };

  const mockEventWithInvalidColor = {
    ...mockEvent,
    color: 'invalid-color',
  };

  const mockEventWithoutColor = {
    ...mockEvent,
    color: undefined,
  };

  const defaultProps = {
    event: mockEvent,
    onClick: vi.fn(),
    onDragStart: vi.fn(),
    isDragging: false,
    onResize: vi.fn(),
  };

  it('renders event details correctly', () => {
    render(<EventItem {...defaultProps} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
  });

  it('handles invalid color by falling back to blue', () => {
    render(<EventItem {...defaultProps} event={mockEventWithInvalidColor} />);
    const eventElement = screen.getByText('Test Event').closest('div');
    expect(eventElement).toHaveClass('bg-blue-500/10');
  });

  it('handles undefined color by falling back to blue', () => {
    render(<EventItem {...defaultProps} event={mockEventWithoutColor} />);
    const eventElement = screen.getByText('Test Event').closest('div');
    expect(eventElement).toHaveClass('bg-blue-500/10');
  });

  it('shows completed status when event is completed', () => {
    render(
      <EventItem
        {...defaultProps}
        event={{
          ...mockEvent,
          completed: true,
        }}
      />,
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<EventItem {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Event'));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('calls onDragStart when mouse down', () => {
    render(<EventItem {...defaultProps} />);
    fireEvent.mouseDown(screen.getByText('Test Event'));
    expect(defaultProps.onDragStart).toHaveBeenCalled();
  });

  it('applies dragging styles when isDragging is true', () => {
    render(<EventItem {...defaultProps} isDragging={true} />);
    const eventElement = screen.getByText('Test Event').closest('div');
    expect(eventElement).toHaveClass('scale-[1.02]', 'opacity-50', 'shadow-lg');
  });

  it('shows resize handle when onResize is provided', () => {
    render(<EventItem {...defaultProps} />);
    const resizeHandle = screen.getByRole('presentation');
    expect(resizeHandle).toHaveClass('cursor-ns-resize');
  });

  it('handles resize interaction', () => {
    render(<EventItem {...defaultProps} />);
    const resizeHandle = screen.getByRole('presentation');

    fireEvent.mouseDown(resizeHandle, { clientY: 100 });
    fireEvent.mouseMove(document, { clientY: 150 });
    fireEvent.mouseUp(document);

    expect(defaultProps.onResize).toHaveBeenCalled();
  });

  it('renders with correct Google Calendar styling', () => {
    const { container } = render(<EventItem {...defaultProps} />);
    const eventElement = container.firstChild as HTMLElement;

    // Check background color opacity and hover state
    expect(eventElement).toHaveClass('bg-blue-500/[0.14]');
    expect(eventElement).toHaveClass('hover:bg-blue-500/[0.23]');

    // Check border styling
    expect(eventElement).toHaveClass('border-l-[3px]');
    expect(eventElement).toHaveClass('border-blue-500');

    // Check text color
    expect(eventElement).toHaveClass('text-blue-500');
  });

  it('shows correct time format', () => {
    render(<EventItem {...defaultProps} />);
    expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
  });

  it('applies correct height based on duration', () => {
    const { container } = render(<EventItem {...defaultProps} />);
    const eventElement = container.firstChild as HTMLElement;

    // 1 hour = 48px height
    expect(eventElement).toHaveStyle({ height: '48px' });
  });

  it('shows resize handle on hover', async () => {
    const { container } = render(<EventItem {...defaultProps} />);
    const resizeHandle = container.querySelector('[role="presentation"]');

    expect(resizeHandle).toHaveClass('opacity-0');
    expect(resizeHandle).toHaveClass('group-hover:opacity-25');
  });

  it('handles drag and resize interactions', () => {
    render(<EventItem {...defaultProps} />);
    const eventElement = screen.getByText('Test Event').parentElement?.parentElement;

    if (eventElement) {
      fireEvent.mouseDown(eventElement);
      expect(defaultProps.onDragStart).toHaveBeenCalled();
    }
  });
});
