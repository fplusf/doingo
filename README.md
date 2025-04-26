# electron-shadcn

## New feature based folder structure

src/
├─ features/
│ ├─ tasks/
│ │ ├─ components/
│ │ │ ├─ TaskList.jsx
│ │ │ ├─ TaskList.test.jsx // Test right next to the component
│ │ │ ├─ TaskItem.jsx
│ │ │ └─ TaskItem.test.jsx
│ │ ├─ hooks/
│ │ │ ├─ useTasks.js
│ │ │ └─ useTasks.test.js
│ │ ├─ services/
│ │ │ ├─ tasksAPI.js
│ │ │ └─ tasksAPI.test.js
│ │ ├─ pages/
│ │ │ ├─ TasksPage.jsx
│ │ │ └─ TasksPage.test.jsx
│ │ └─ index.js
│ │
│ ├─ calendar/
│ │ ├─ components/
│ │ │ ├─ CalendarView.jsx
│ │ │ ├─ CalendarView.test.jsx
│ │ │ ├─ CalendarHeader.jsx
│ │ │ └─ CalendarHeader.test.jsx
│ │ ├─ hooks/
│ │ │ ├─ useCalendar.js
│ │ │ └─ useCalendar.test.js
│ │ ├─ services/
│ │ │ ├─ calendarAPI.js
│ │ │ └─ calendarAPI.test.js
│ │ ├─ pages/
│ │ │ ├─ CalendarPage.jsx
│ │ │ └─ CalendarPage.test.jsx
│ │ └─ index.js
│ │
│ └─ reminders/
│ ├─ components/
│ ├─ hooks/
│ ├─ services/
│ ├─ pages/
│ └─ index.js
│
├─ shared/
│ ├─ components/
│ │ ├─ Button.jsx
│ │ └─ Button.test.jsx
│ │ └─ Modal.jsx
│ │ └─ Modal.test.jsx
│ ├─ hooks/
│ │ ├─ useLocalStorage.js
│ │ └─ useLocalStorage.test.js
│ ├─ utils/
│ │ ├─ dateHelpers.js
│ │ └─ dateHelpers.test.js
│ └─ ...
│
├─ router/
│ └─ index.jsx
│
├─ App.jsx
└─ index.jsx

Electron in all its glory. Everything you will need to develop your beautiful desktop application.

![Demo GIF](https://github.com/LuanRoger/electron-shadcn/blob/main/images/demo.gif)

## Libs and tools

To develop a Electron app, you probably will need some UI, test, formatter, style or other kind of library or framework, so let me install and configure some of them to you.

### Core 🏍️

- [Electron 32](https://www.electronjs.org)
- [Vite 5](https://vitejs.dev)
- [SWC](https://swc.rs)

### DX 🛠️

- [TypeScript 5](https://www.typescriptlang.org)
- [Prettier](https://prettier.io)
- [Zod](https://zod.dev)
- [React Query (Tan Stack)](https://react-query.tanstack.com)

### UI 🎨

- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Geist](https://vercel.com/font) as default font
- [i18next](https://www.i18next.com)
- [Lucide](https://lucide.dev)

### Test 🧪

- [Jest](https://jestjs.io)
- [Playwright](https://playwright.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### Packing and distribution 📦

- [Electron Forge](https://www.electronforge.io)

### Documentation 📚

- [Storybook](https://storybook.js.org)

### CI/CD 🚀

- Pre-configured [GitHub Actions workflow](https://github.com/LuanRoger/electron-shadcn/blob/main/.github/workflows/playwright.yml), for test with Playwright

### Project preferences 🎯

- Use Context isolation
- `titleBarStyle`: hidden (Using custom title bar)
- Geist as default font
- Some default styles was applied, check the [`styles`](https://github.com/LuanRoger/electron-shadcn/tree/main/src/styles) directory

> If you don't know some of these libraries or tools, I recommend you to check their documentation to understand how they work and how to use them.

## Directory structure

```plaintext
.
└── ./src/
    ├── ./src/assets/
    │   └── ./src/assets/fonts/
    ├── ./src/components/
    │   └── ./src/components/ui/
    ├── ./src/helpers/
    │   └── ./src/helpers/ipc/
    ├── ./src/layout/
    ├── ./src/lib/
    ├── ./src/pages/
    ├── ./src/stories/
    ├── ./src/style/
    └── ./src/tests/
```

- `src/`: Main directory
  - `assets/`: Store assets like images, fonts, etc.
  - `components/`: Store UI components
    - `ui/`: Store Shadcn UI components (this is the default direcotry used by Shadcn UI)
  - `helpers/`: Store IPC related functions to be called in the renderer process
    - `ipc/`: Directory to store IPC context and listener functions
      - Some implementations are already done, like `theme` and `window` for the custom title bar
  - `layout/`: Directory to store layout components
  - `lib/`: Store libraries and other utilities
  - `pages/`: Store app's pages
  - `stories/`: Store Storybook stories
  - `style/`: Store global styles
  - `tests/`: Store tests (from Jest and Playwright)

## NPM script

To run any of those scripts:

```bash
npm run <script>
```

- `start`: Start the app in development mode
- `package`: Package your application into a platform-specific executable bundle and put the result in a folder.
- `make`: Generate platform-specific distributables (e.g. .exe, .dmg, etc) of your application for distribution.
- `publish`: Electron Forge's way of taking the artifacts generated by the `make` command and sending them to a service somewhere for you to distribute or use as updates.
- `prett`: Run Prettier to format the code
- `storybook`: Start Storybook
- `build-storybook`: Run the Storybook's build command
- `test`: Run the default unit-test script (Jest)
- `test:watch`: Run the default unit-test script in watch mode (Jest)
- `test:unit`: Run the Jest tests
- `test:e2e`: Run the Playwright tests
- `test:all`: Run all tests (Jest and Playwright)

The test scripts involving Playwright require the app be builded before running the tests. So, before run the tests, run the `package`, `make` or `publish` script.

## How to use

1. Clone this repository

```bash
git clone https://github.com/LuanRoger/electron-shadcn.git
```

Or use it as a template on GitHub

2. Install dependencies

```bash
npm install
```

3. Run the app

```bash
npm run start
```

## Used by

- [yaste](https://github.com/LuanRoger/yaste) - yaste (Yet another super ₛᵢₘₚₗₑ text editor) is a text editor, that can be used as an alternative to the native text editor of your SO, maybe.
- [eletric-drizzle](https://github.com/LuanRoger/electric-drizzle) - shadcn-ui and Drizzle ORM with Electron.

> Does you've used this template in your project? Add it here and open a PR.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/LuanRoger/electron-shadcn/blob/main/LICENSE) file for details.

# optimal-adhd-react

## Task Management Documentation

### Overview

The task management feature is designed to help users organize and manage their tasks efficiently. It includes components for displaying tasks, hooks for managing task state, and services for interacting with task data.

### Components

#### TasksList Component

- **Purpose**: Displays a list of tasks, manages their state, and handles interactions such as creating, editing, and dragging tasks.
- **Key Features**:
  - **State Management**: Utilizes hooks to manage task-related states such as `isCreating`, `activeCategory`, `editingTask`, and more.
  - **Task Sorting**: Sorts tasks by start time and categorizes them.
  - **Drag and Drop**: Implements drag-and-drop functionality using `dnd-kit` to reorder tasks.
  - **Task Creation and Editing**: Provides dialogs for creating and editing tasks, with initial values populated from the current state.
  - **Edge Cases**:
    - Handles empty task lists by ensuring default values are set.
    - Manages task movement across dates, showing a toast notification when a task is moved.
    - Ensures tasks are not dragged over gaps or invalid positions.

#### TaskItem Component

- **Purpose**: Represents individual tasks within the list, providing controls for editing, focusing, and completing tasks.
- **Key Features**:
  - **Task Display**: Shows task details such as title, duration, and start time, with dynamic styling based on task state (e.g., completed, focused).
  - **Focus and Details**: Allows users to focus on a task or view its details, with keyboard and mouse interactions.
  - **Subtasks and Progress**: Displays progress for tasks with subtasks, updating dynamically.
  - **Edge Cases**:
    - Handles tasks with no start time by providing default values.
    - Manages task focus state, ensuring tasks are moved to the current time if not already focused.
    - Provides accessibility features such as keyboard navigation and tooltips.

### Hooks

#### useTasksProgress Hook

- **Purpose**: Manages the calculation of task progress for a given date.
- **Functionality**:
  - Filters tasks by date and calculates the completion percentage based on task completion and individual task progress.
  - Returns a function `getProgressForDate` that provides the progress percentage for a specified date.

#### useSubtasksCollapse Hook

- **Purpose**: Manages the collapsed state of subtasks.
- **Functionality**:
  - Uses local storage to persist the collapsed state of subtasks across sessions.
  - Provides `isSubtasksOpen` and `setIsSubtasksOpen` to get and set the collapse state.

#### useWeekNavigation Hook

- **Purpose**: Handles navigation logic for weekly task views.
- **Functionality**:
  - Manages the current week view and allows navigation between weeks.
  - Updates the selected date based on URL search parameters.
  - Provides functions for selecting dates, navigating to the next or previous week, and animating week transitions.

### Future Improvements

- Consider adding more detailed error handling and user feedback for network operations.
- Explore opportunities to optimize performance for large task lists.
- Enhance accessibility features to ensure compliance with WCAG standards.

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
