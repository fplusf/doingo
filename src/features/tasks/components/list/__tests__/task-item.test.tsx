import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OptimalTask } from '../../../types';
import { TaskItem } from '../task-item';

describe('TaskItem', () => {
  const mockTask: OptimalTask = {
    id: '1',
    title: 'Test Task',
    completed: false,
    duration: 3600000, // 1 hour
    taskDate: '2024-03-20',
    time: '09:00',
    startTime: new Date('2024-03-20T09:00:00'),
    nextStartTime: new Date('2024-03-20T10:00:00'),
    priority: 'low',
    category: 'work',
    isFocused: false,
    subtasks: [],
    progress: 0,
  };

  it('should have correct border styles', () => {
    render(<TaskItem task={mockTask} onEdit={() => {}} />);

    const taskCard = screen.getByRole('button');

    // Check if the element has the correct inline styles for border
    expect(taskCard.style.border).toBe('1px solid transparent');
    expect(taskCard.style.transition).toContain('border-color');

    // Test that border changes on hover
    fireEvent.mouseEnter(taskCard);
    expect(taskCard.style.borderColor).toBe('#a991f7');

    fireEvent.mouseLeave(taskCard);
    expect(taskCard.style.borderColor).toBe('transparent');
  });
});
