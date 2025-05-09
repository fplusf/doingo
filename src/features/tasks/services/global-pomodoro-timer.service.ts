import { ElectronApi } from '@/shared/types/electron';

// --- Constants ---
const DEFAULT_POMODORO_DURATION = 25 * 60 * 1000;
const DEFAULT_BREAK_DURATION = 5 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'global_pomodoro_timer_';

// --- Types ---
export type TimerMode = 'pomodoro' | 'break';

interface PersistedTimerState {
  currentTaskId: string | null;
  isRunning: boolean;
  activeMode: TimerMode;
  remainingTime: number; // in ms
  sessionStartTime: string | null; // ISO string
  pomodoroDuration: number;
  breakDuration: number;
  lastUpdated: number; // timestamp
}

export interface TimerState {
  currentTaskId: string | null;
  isRunning: boolean;
  activeMode: TimerMode;
  remainingTime: number;
  sessionStartTime: Date | null;
  pomodoroDuration: number;
  breakDuration: number;
}

// --- Service State ---
let electronApi: ElectronApi | undefined;

// No need for interval here anymore, as it runs in the main process
let state: TimerState = {
  currentTaskId: null,
  isRunning: false,
  activeMode: 'pomodoro',
  remainingTime: DEFAULT_POMODORO_DURATION,
  sessionStartTime: null,
  pomodoroDuration: DEFAULT_POMODORO_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
};

type Subscriber = (currentState: Readonly<TimerState>) => void;
const subscribers: Set<Subscriber> = new Set();

// --- Private Helper Functions ---

function _getStorageKey(taskId?: string | null): string {
  return `${STORAGE_KEY_PREFIX}current_instance`;
}

function _notifySubscribers(): void {
  subscribers.forEach((callback) => callback(Object.freeze({ ...state })));
}

function _formatTimeForTray(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function _sendTrayUpdate(): void {
  if (electronApi?.ipcRenderer) {
    let timeToShow = state.remainingTime;
    if (state.remainingTime <= 0 && !state.isRunning) {
      // Timer stopped and ended
      timeToShow = state.activeMode === 'pomodoro' ? state.pomodoroDuration : state.breakDuration;
    }
    electronApi.ipcRenderer.send('update-timer', _formatTimeForTray(timeToShow));
  }
}

function _saveState(): void {
  const persistableState: PersistedTimerState = {
    ...state,
    sessionStartTime: state.sessionStartTime?.toISOString() || null,
    lastUpdated: Date.now(),
  };
  localStorage.setItem(_getStorageKey(), JSON.stringify(persistableState));
  _notifySubscribers();
}

function _loadState(): boolean {
  try {
    const saved = localStorage.getItem(_getStorageKey());
    if (!saved) {
      return false;
    }

    const persisted = JSON.parse(saved) as PersistedTimerState;

    state = {
      currentTaskId: persisted.currentTaskId,
      isRunning: false, // Always start with timer paused
      activeMode: persisted.activeMode,
      remainingTime: persisted.remainingTime,
      sessionStartTime: null,
      pomodoroDuration: persisted.pomodoroDuration,
      breakDuration: persisted.breakDuration,
    };

    // Sync with main process
    _syncWithMainProcess();

    _notifySubscribers();
    return true;
  } catch (e) {
    console.error('Error loading global timer state:', e);
    localStorage.removeItem(_getStorageKey());
    return false;
  }
}

// Function to sync settings with main process
async function _syncWithMainProcess(): Promise<void> {
  if (!electronApi?.ipcRenderer) return;

  try {
    // Update durations in main process
    await electronApi.ipcRenderer.invoke('set-pomodoro-duration', state.pomodoroDuration);
    await electronApi.ipcRenderer.invoke('set-break-duration', state.breakDuration);

    // Get latest state from main process
    const mainState = await electronApi.ipcRenderer.invoke('get-pomodoro-state');

    // Update local state with main process state
    state = {
      ...state,
      isRunning: mainState.isRunning,
      activeMode: mainState.activeMode,
      remainingTime: mainState.remainingTime,
      currentTaskId: mainState.currentTaskId || state.currentTaskId,
      sessionStartTime: mainState.isRunning ? new Date() : null,
    };

    _notifySubscribers();
  } catch (error) {
    console.error('Error syncing with main process:', error);
  }
}

// --- Public API ---

export function initializeGlobalTimer(): void {
  if (typeof window !== 'undefined') {
    electronApi = window.electron;

    // Listen for timer updates from main process
    electronApi?.ipcRenderer?.on('pomodoro-timer-tick', (data) => {
      try {
        // Validate data structure
        if (!data || typeof data !== 'object') {
          console.warn('Received invalid data in pomodoro-timer-tick event:', data);
          // Don't return, continue with current state
          data = {
            isRunning: state.isRunning,
            activeMode: state.activeMode,
            remaining: state.remainingTime,
            currentTaskId: state.currentTaskId,
          };
        }

        // Validate required fields with type checking and use current state as fallback
        const isRunning = typeof data.isRunning === 'boolean' ? data.isRunning : state.isRunning;
        const activeMode =
          data.activeMode === 'pomodoro' || data.activeMode === 'break'
            ? data.activeMode
            : state.activeMode;
        const remaining =
          typeof data.remaining === 'number' && !isNaN(data.remaining)
            ? data.remaining
            : state.remainingTime;
        const currentTaskId =
          typeof data.currentTaskId === 'string' || data.currentTaskId === null
            ? data.currentTaskId
            : state.currentTaskId;

        // Update state with validated data
        state = {
          ...state,
          isRunning,
          activeMode,
          remainingTime: remaining,
          currentTaskId: currentTaskId || state.currentTaskId,
          sessionStartTime: isRunning ? state.sessionStartTime || new Date() : null,
          pomodoroDuration: state.pomodoroDuration,
          breakDuration: state.breakDuration,
        };

        // Only notify subscribers if state actually changed
        _notifySubscribers();
      } catch (error) {
        console.error('Error processing pomodoro-timer-tick event:', error);
        // Continue with current state
      }
    });

    // Listen for timer completion
    electronApi?.ipcRenderer?.on('pomodoro-timer-completed', (_, completedMode) => {
      state = {
        ...state,
        isRunning: false,
        remainingTime: 0,
        sessionStartTime: null,
      };

      // TODO: Handle completion (e.g., switch mode, notify user, record session)
      const mode = completedMode || state.activeMode; // Fallback if completedMode is undefined
      console.log(`Timer for task ${state.currentTaskId} in mode ${mode} finished.`);
      _saveState();
      _notifySubscribers();
    });
  }

  _loadState();
  console.log('Global Pomodoro Timer Service Initialized. State:', state);
}

export async function startPomodoroTimer(
  taskId: string,
  requestedMode?: TimerMode,
  duration?: number, // Specific duration for this session
  keepCurrentRemainingTime: boolean = false,
): Promise<void> {
  if (!electronApi?.ipcRenderer) return;

  const modeToStart = requestedMode || state.activeMode;
  let timeToStart = 0;

  if (
    keepCurrentRemainingTime &&
    state.currentTaskId === taskId &&
    state.activeMode === modeToStart &&
    state.remainingTime > 0
  ) {
    timeToStart = state.remainingTime;
  } else if (duration) {
    timeToStart = duration;
  } else {
    timeToStart = modeToStart === 'pomodoro' ? state.pomodoroDuration : state.breakDuration;
  }

  try {
    // Update local state first for immediate UI response
    state = {
      ...state,
      currentTaskId: taskId,
      isRunning: true,
      activeMode: modeToStart,
      remainingTime: timeToStart,
      sessionStartTime: new Date(),
      // Update specific duration if provided
      pomodoroDuration: modeToStart === 'pomodoro' && duration ? duration : state.pomodoroDuration,
      breakDuration: modeToStart === 'break' && duration ? duration : state.breakDuration,
    };

    // Notify subscribers of the immediate change
    _notifySubscribers();

    // Start timer in main process
    const response = await electronApi.ipcRenderer.invoke('start-pomodoro-timer', {
      taskId,
      mode: modeToStart,
      duration: timeToStart,
    });

    // Update state with response from main process
    state = {
      ...state,
      isRunning: response.isRunning,
      remainingTime: response.remainingTime,
    };

    _saveState();
    console.log(
      `Global timer started for task ${taskId}, mode ${modeToStart}, duration ${timeToStart}`,
    );
  } catch (error) {
    console.error('Error starting pomodoro timer in main process:', error);
    // Revert state on error
    state.isRunning = false;
    state.sessionStartTime = null;
    _notifySubscribers();
  }
}

export async function pausePomodoroTimer(): Promise<void> {
  if (!state.isRunning || !electronApi?.ipcRenderer) return;

  try {
    // Update local state first for immediate UI response
    state.isRunning = false;
    _notifySubscribers();

    // Pause timer in main process
    const response = await electronApi.ipcRenderer.invoke('pause-pomodoro-timer');

    // Calculate elapsed time if session was running
    if (state.sessionStartTime) {
      const elapsed = Date.now() - state.sessionStartTime.getTime();
      // TODO: Record partial session if needed
      console.log(`Partial session duration: ${elapsed}ms`);
    }

    // Update with main process state
    state = {
      ...state,
      isRunning: response.isRunning,
      remainingTime: response.remainingTime,
      sessionStartTime: null,
    };

    _saveState();
    console.log(`Global timer paused for task ${state.currentTaskId}`);
  } catch (error) {
    console.error('Error pausing pomodoro timer in main process:', error);
  }
}

export async function resetPomodoroTimer(taskIdToReset: string | null): Promise<void> {
  if (!electronApi?.ipcRenderer) return;

  try {
    // Reset timer in main process
    const response = await electronApi.ipcRenderer.invoke('reset-pomodoro-timer', taskIdToReset);

    // Determine the duration to reset to
    let resetDuration;
    let modeToResetTo = state.activeMode;

    if (state.currentTaskId === taskIdToReset && taskIdToReset !== null) {
      modeToResetTo = state.activeMode;
      resetDuration =
        state.activeMode === 'pomodoro' ? state.pomodoroDuration : state.breakDuration;
    } else {
      modeToResetTo = 'pomodoro';
      resetDuration = state.pomodoroDuration;
    }

    const previousTaskId = state.currentTaskId;

    state = {
      ...state,
      currentTaskId:
        state.currentTaskId === taskIdToReset || taskIdToReset === null
          ? taskIdToReset
          : state.currentTaskId,
      isRunning: false,
      activeMode:
        state.currentTaskId === taskIdToReset || taskIdToReset === null
          ? modeToResetTo
          : state.activeMode,
      remainingTime: resetDuration,
      sessionStartTime: null,
    };

    _saveState();
    console.log(
      `Global timer reset. Task context: ${taskIdToReset}, Mode: ${modeToResetTo}, Duration: ${resetDuration}`,
    );
  } catch (error) {
    console.error('Error resetting pomodoro timer in main process:', error);
  }
}

export async function switchPomodoroMode(
  newMode: TimerMode,
  taskId: string | null = state.currentTaskId,
): Promise<void> {
  if (!electronApi?.ipcRenderer) return;

  try {
    // Switch mode in main process
    const response = await electronApi.ipcRenderer.invoke('switch-pomodoro-mode', {
      mode: newMode,
      taskId,
    });

    const newDuration = newMode === 'pomodoro' ? state.pomodoroDuration : state.breakDuration;

    state = {
      ...state,
      currentTaskId: taskId,
      isRunning: false,
      activeMode: newMode,
      remainingTime: newDuration,
      sessionStartTime: null,
    };

    _saveState();
    console.log(`Global timer switched to ${newMode} for task ${taskId}`);
  } catch (error) {
    console.error('Error switching pomodoro mode in main process:', error);
  }
}

export async function setGlobalPomodoroDuration(duration: number): Promise<void> {
  if (!electronApi?.ipcRenderer) {
    state.pomodoroDuration = duration;
    if (state.activeMode === 'pomodoro' && !state.isRunning) {
      state.remainingTime = duration;
    }
    _saveState();
    return;
  }

  try {
    // Update in main process
    const response = await electronApi.ipcRenderer.invoke('set-pomodoro-duration', duration);

    state.pomodoroDuration = duration;
    if (state.activeMode === 'pomodoro' && !state.isRunning) {
      state.remainingTime = duration;
    }

    _saveState();
  } catch (error) {
    console.error('Error setting pomodoro duration in main process:', error);
  }
}

export async function setGlobalBreakDuration(duration: number): Promise<void> {
  if (!electronApi?.ipcRenderer) {
    state.breakDuration = duration;
    if (state.activeMode === 'break' && !state.isRunning) {
      state.remainingTime = duration;
    }
    _saveState();
    return;
  }

  try {
    // Update in main process
    const response = await electronApi.ipcRenderer.invoke('set-break-duration', duration);

    state.breakDuration = duration;
    if (state.activeMode === 'break' && !state.isRunning) {
      state.remainingTime = duration;
    }

    _saveState();
  } catch (error) {
    console.error('Error setting break duration in main process:', error);
  }
}

export function getCurrentPomodoroState(): Readonly<TimerState> {
  return Object.freeze({ ...state });
}

export function subscribeToGlobalTimer(callback: Subscriber): () => void {
  subscribers.add(callback);
  // Immediately call with current state
  callback(getCurrentPomodoroState());
  return () => {
    subscribers.delete(callback);
  };
}

// TODO: Implement recordPomodoroSession and recordBreak if they should be part of this service
// or ensure they are called appropriately when a session/break completes.

// Initialize on load (e.g. in your main App component or a top-level entry point)
// initializeGlobalTimer(); // This should be called once when the app's renderer process starts.
