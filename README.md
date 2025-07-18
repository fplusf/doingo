# electron-shadcn

## Task Scheduling and Time Management

### Overlap Resolution

The application includes a sophisticated overlap resolution system to handle scheduling conflicts between tasks. Here's how it works:

#### Automatic Overlap Detection

- The system automatically detects when tasks overlap in time
- Overlapping tasks are indicated with a yellow blend icon (⚡)
- Users can hover over overlapping tasks to see resolution options

#### Resolution Options

1. **Single Task Resolution**: Moves only the next overlapping task

   - Finds the next available time slot after the current task, if not found iterates through next tasks until finds a free slot
   - Maintains task duration while adjusting start time
   - Preserves any subsequent non-overlapping tasks

2. **Resolve All**: Adjusts all consecutive overlapping tasks
   - Moves all affected tasks forward in sequence
   - Only adjusts tasks that actually have time conflicts
   - Stops processing once it finds a task with no overlap
   - Preserves task durations and relative spacing

### Time-Sensitive Tasks

The application supports marking tasks as time-sensitive to prevent automatic time adjustments.

#### Features

- Tasks can be marked as time-sensitive using the checkbox in the task scheduler
- Time-sensitive tasks are protected from automatic time adjustments
- Indicated by a red accent color when enabled

#### Behavior

1. **During Overlap Resolution**:

   - Time-sensitive tasks cannot be moved by the overlap resolver
   - Overlaps with time-sensitive tasks show a red indicator
   - Resolution buttons are hidden for time-sensitive tasks
   - Tooltip indicates that the task cannot be moved

2. **Protection Mechanism**:
   - Prevents both single and bulk resolution attempts
   - Forces users to manually adjust non-time-sensitive tasks instead
   - Maintains the exact scheduled time for critical appointments

#### Use Cases

- Important meetings that cannot be rescheduled
- Time-bound appointments or deadlines
- Tasks that must occur at specific times
- Scheduled breaks or time-blocked periods

This system ensures that critical time-sensitive tasks maintain their scheduled times while allowing flexible adjustment of other tasks around them.
