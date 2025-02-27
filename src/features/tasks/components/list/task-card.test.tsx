import { describe, expect, it } from 'vitest';

describe('Task Card', () => {
  it('the task card must have a hover effect', () => {
    const taskContainer = document.querySelector('.task-card');
    expect(taskContainer).toHaveStyle('hover:bg-sidebar');
  });
});
