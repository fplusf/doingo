import { exec } from 'child_process';
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, Tray } from 'electron';
import path from 'path';
import registerListeners from './shared/helpers/ipc/listeners-register';

const inDevelopment = process.env.NODE_ENV === 'development';

// Countdown state
let countdownInterval: NodeJS.Timeout | null = null;
let countdownEndTime: number | null = null;
// Stores remaining time whenever the timer is paused so we can resume accurately.
let pausedRemainingTime: number | null = null;

// Pomodoro timer state
type TimerMode = 'pomodoro' | 'break';
interface PomodoroState {
  currentTaskId: string | null;
  isRunning: boolean;
  activeMode: TimerMode;
  endTime: number | null;
  pomodoroDuration: number;
  breakDuration: number;
}

const pomodoroState: PomodoroState = {
  currentTaskId: null,
  isRunning: false,
  activeMode: 'pomodoro',
  endTime: null,
  pomodoroDuration: 25 * 60 * 1000, // 25 minutes
  breakDuration: 5 * 60 * 1000, // 5 minutes
};

// Function to format time string with fixed width
const formatTrayTitle = (timeString: string): string => {
  // Convert to monospace digits to prevent shifting (analog to CSS tabular-nums)
  const toMonospace = (str: string): string => {
    const monospaceMap: { [key: string]: string } = {
      '0': '𝟶',
      '1': '𝟷',
      '2': '𝟸',
      '3': '𝟹',
      '4': '𝟺',
      '5': '𝟻',
      '6': '𝟼',
      '7': '𝟽',
      '8': '𝟾',
      '9': '𝟿',
    };
    return str.replace(/[0-9]/g, (digit) => monospaceMap[digit] || digit);
  };

  return ` ${toMonospace(timeString)} `;
};

// Function to update the tray timer display
const updateTrayTimer = (timeString: string) => {
  if (tray && typeof timeString === 'string') {
    // Accept format like "12:34" or "25:00"
    const validTimePattern = /^\d{2}:\d{2}$/;

    if (validTimePattern.test(timeString)) {
      console.log(`[Main Process] Setting tray title to: ${timeString}`);
      tray.setTitle(formatTrayTitle(timeString));

      const newContextMenu = Menu.buildFromTemplate([
        { label: timeString, enabled: false },
        { type: 'separator' },
        {
          label: 'Hide',
          type: 'normal',
          click: () => {
            const windows = BrowserWindow.getAllWindows();
            windows.forEach((window) => window.hide());
          },
        },
      ]);
      tray.setContextMenu(newContextMenu);
    } else {
      console.warn(`[Main Process] Invalid time format: ${timeString}`);
      // Default to showing 00:00 instead of --:--
      tray.setTitle(formatTrayTitle('00:00'));
    }
  }
};

// Function to clear existing countdown
const clearCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownEndTime = null;
  pausedRemainingTime = null;
  pomodoroState.isRunning = false;
  pomodoroState.endTime = null;
  // Don't reset the tray here, as we want to keep showing the paused timer
};

// Function to start countdown based on endTime
const startCountdown = (endTime: number) => {
  clearCountdown();

  countdownEndTime = endTime;
  pomodoroState.isRunning = true;
  pomodoroState.endTime = endTime;

  const updateDisplay = () => {
    const now = Date.now();
    const remaining = countdownEndTime! - now;

    if (remaining <= 0) {
      clearCountdown();
      // Notify renderer process that timer has completed
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('pomodoro-timer-completed', pomodoroState.activeMode);
      });
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    updateTrayTimer(timeString);

    // Send timer update to renderer
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('pomodoro-timer-tick', {
        remaining,
        timeString,
        isRunning: pomodoroState.isRunning,
        activeMode: pomodoroState.activeMode,
        currentTaskId: pomodoroState.currentTaskId,
      });
    });
  };

  // Initial update
  updateDisplay();

  // Update every 100ms for smooth countdown
  countdownInterval = setInterval(updateDisplay, 100);
};

// Function to get current timer state
const getTimerState = () => {
  const now = Date.now();
  const remaining = pomodoroState.isRunning
    ? Math.max(0, (pomodoroState.endTime ?? now) - now)
    : (pausedRemainingTime ??
      (pomodoroState.activeMode === 'pomodoro'
        ? pomodoroState.pomodoroDuration
        : pomodoroState.breakDuration));

  return {
    ...pomodoroState,
    remainingTime: Math.max(0, remaining),
  };
};

const openBrowser = async (url: string) => {
  const open = (await import('open')).default;
  await open(url);
};

function createWindow() {
  const preload = path.join(__dirname, 'preload.js');
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
      webSecurity: true,
      backgroundThrottling: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: {
      x: 16,
      y: 16,
    },
  });

  registerListeners(mainWindow);

  const appUrl =
    MAIN_WINDOW_VITE_DEV_SERVER_URL ||
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
  // Set CSP headers for Excalidraw
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: details.responseHeaders,
    });
  });

  mainWindow.loadURL(appUrl);

  // Only open DevTools if loading from dev server URL (browser)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
    console.log('Opening DevTools');
    openBrowser(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  }

  if (inDevelopment) {
    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting Vite dev server: ${error.message}`);
        return;
      }
      console.log(`Vite dev server started: ${stdout}`);
      openBrowser('http://localhost:3000');
    });
  }
}

let tray: Tray | null = null;

app.whenReady().then(() => {
  console.log('[Main Process] App ready.');
  createWindow();

  // Create a small transparent template icon for macOS (16x16 pixels)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABSdEVYdENvcHlyaWdodABDQzAgUHVibGljIERvbWFpbiBEZWRpY2F0aW9uIGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL3B1YmxpY2RvbWFpbi96ZXJvLzEuMC/g6U44AAAAPUlEQVQ4jWNgGAWDCPz////wf0YGBkYGBgaG////M+LTwMTAwMBATEZSNDAwMDDgM4BkgM8FowYMRQAATdoVEd0jqDIAAAAASUVORK5CYII=',
  );

  // Set as template image (macOS only)
  icon.setTemplateImage(true);

  // Create the tray with template icon
  tray = new Tray(icon);

  // Set initial title with default value (00:00)
  tray.setTitle(formatTrayTitle('00:00'));

  const contextMenu = Menu.buildFromTemplate([
    { label: '00:00', enabled: false },
    { type: 'separator' },
    {
      label: 'Hide',
      type: 'normal',
      click: () => {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((window) => window.hide());
      },
    },
  ]);

  tray.setToolTip('Optimal Timer');
  tray.setContextMenu(contextMenu);

  // Listen for timer updates from the renderer process
  console.log('[Main Process] Setting up IPC listener for update-timer.');
  ipcMain.on('update-timer', (event, timeString: string) => {
    console.log(`[Main Process] Received timer update: ${timeString}`);
    // Only update tray if main process countdown is not running to avoid conflicts
    if (!pomodoroState.isRunning && !countdownInterval) {
      updateTrayTimer(timeString);
    }
  });

  // Listen for notification requests from renderer process
  ipcMain.on('show-notification', (_event, { title, body }: { title: string; body: string }) => {
    try {
      // Create and show a new system notification
      new Notification({ title, body }).show();
    } catch (error) {
      console.error('[Main Process] Failed to show notification:', error);
    }
  });

  // Add click handler to show window when tray is clicked
  tray.on('click', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.show();
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    });
  });

  // --- Pomodoro timer IPC handlers ---

  // Start pomodoro timer
  ipcMain.handle(
    'start-pomodoro-timer',
    (
      event,
      args: {
        taskId: string;
        mode: TimerMode;
        duration?: number;
      },
    ) => {
      const { taskId, mode, duration } = args;
      pomodoroState.currentTaskId = taskId;
      pomodoroState.activeMode = mode;

      const timerDuration =
        duration ||
        (mode === 'pomodoro' ? pomodoroState.pomodoroDuration : pomodoroState.breakDuration);

      const endTime = Date.now() + timerDuration;
      startCountdown(endTime);

      return getTimerState();
    },
  );

  // Pause pomodoro timer
  ipcMain.handle('pause-pomodoro-timer', () => {
    // If the timer is already paused, simply return the current state
    if (!pomodoroState.isRunning) {
      return getTimerState();
    }

    // Compute the remaining time BEFORE clearing the interval so we don't lose it
    let remaining = 0;

    if (countdownEndTime) {
      remaining = Math.max(0, countdownEndTime - Date.now());
    } else {
      // Fallback to full duration if for some reason we don't have an endTime
      remaining =
        pomodoroState.activeMode === 'pomodoro'
          ? pomodoroState.pomodoroDuration
          : pomodoroState.breakDuration;
    }

    // Stop the countdown and mark the timer as not running
    clearCountdown();

    // Persist the paused remaining time so future queries reflect the correct value
    pausedRemainingTime = remaining;

    // Update the tray to reflect the paused time so the user sees an accurate value
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    updateTrayTimer(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    );

    // Return the updated state with the correct remainingTime so the renderer can resume later
    return {
      ...pomodoroState,
      isRunning: false,
      remainingTime: remaining,
    };
  });

  // Reset pomodoro timer
  ipcMain.handle('reset-pomodoro-timer', (event, taskId: string | null) => {
    clearCountdown();
    pomodoroState.currentTaskId = taskId;

    const resetDuration =
      pomodoroState.activeMode === 'pomodoro'
        ? pomodoroState.pomodoroDuration
        : pomodoroState.breakDuration;

    const minutes = Math.floor(resetDuration / 60000);
    const seconds = Math.floor((resetDuration % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    updateTrayTimer(timeString);

    return getTimerState();
  });

  // Switch pomodoro mode
  ipcMain.handle(
    'switch-pomodoro-mode',
    (
      event,
      args: {
        mode: TimerMode;
        taskId: string | null;
      },
    ) => {
      const { mode, taskId } = args;
      clearCountdown();
      pomodoroState.activeMode = mode;
      pomodoroState.currentTaskId = taskId;

      const newDuration =
        mode === 'pomodoro' ? pomodoroState.pomodoroDuration : pomodoroState.breakDuration;

      const minutes = Math.floor(newDuration / 60000);
      const seconds = Math.floor((newDuration % 60000) / 1000);
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      updateTrayTimer(timeString);

      return getTimerState();
    },
  );

  // Set timer durations
  ipcMain.handle('set-pomodoro-duration', (event, duration: number) => {
    pomodoroState.pomodoroDuration = duration;
    // Only reflect duration change in tray if timer is currently running in this mode
    if (pomodoroState.activeMode === 'pomodoro' && pomodoroState.isRunning) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      updateTrayTimer(timeString);
    }
    return getTimerState();
  });

  ipcMain.handle('set-break-duration', (event, duration: number) => {
    pomodoroState.breakDuration = duration;
    // Only reflect duration change in tray if timer is currently running in this mode
    if (pomodoroState.activeMode === 'break' && pomodoroState.isRunning) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      updateTrayTimer(timeString);
    }
    return getTimerState();
  });

  // Get current timer state
  ipcMain.handle('get-pomodoro-state', () => {
    return getTimerState();
  });

  // Legacy handlers (keeping for backward compatibility)
  ipcMain.on('start-countdown', (event, endTime: number) => {
    console.log(`[Main Process] Received start-countdown: ${endTime}`);
    // Ensure main process takes control of timer
    pomodoroState.isRunning = true;
    startCountdown(endTime);
  });

  ipcMain.on('stop-countdown', () => {
    console.log('[Main Process] Received stop-countdown');
    clearCountdown();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
