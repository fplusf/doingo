import { exec } from 'child_process';
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import path from 'path';
import registerListeners from './shared/helpers/ipc/listeners-register';

const inDevelopment = process.env.NODE_ENV === 'development';

// Countdown state
let countdownInterval: NodeJS.Timeout | null = null;
let countdownEndTime: number | null = null;

// Function to format time string with fixed width
const formatTrayTitle = (timeString: string): string => {
  // Add spaces on both sides to create fixed width
  // Using monospace characters to ensure consistent width
  return ` ${timeString} `;
};

// Function to update the tray timer display
const updateTrayTimer = (timeString: string) => {
  if (tray && typeof timeString === 'string') {
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString) || timeString === '--:--:--') {
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
      tray.setTitle(formatTrayTitle('--:--:--'));
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
  updateTrayTimer('--:--:--');
};

// Function to start countdown
const startCountdown = (endTime: number) => {
  clearCountdown();

  countdownEndTime = endTime;

  const updateDisplay = () => {
    const now = Date.now();
    const remaining = countdownEndTime! - now;

    if (remaining <= 0) {
      clearCountdown();
      return;
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    updateTrayTimer(timeString);
  };

  // Initial update
  updateDisplay();

  // Update every 100ms for smooth countdown
  countdownInterval = setInterval(updateDisplay, 100);
};

const openBrowser = async (url: string) => {
  const open = (await import('open')).default;
  await open(url);
};

function createWindow() {
  const preload = path.join(__dirname, 'preload.js');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
      webSecurity: true,
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

  // Set initial title with fixed width
  tray.setTitle(formatTrayTitle('--:--:--'));

  const contextMenu = Menu.buildFromTemplate([
    { label: '--:--:--', enabled: false },
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
    if (tray && typeof timeString === 'string') {
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeString) || timeString === '--:--:--') {
        console.log(`[Main Process] Setting tray title to: ${timeString}`);
        // Use the formatTrayTitle function to ensure fixed width
        tray.setTitle(formatTrayTitle(timeString));
        // Also update the context menu
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
        tray.setTitle(formatTrayTitle('--:--:--'));
      }
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

  // Listen for countdown control from renderer process
  ipcMain.on('start-countdown', (event, endTime: number) => {
    console.log(`[Main Process] Starting countdown to: ${new Date(endTime).toISOString()}`);
    startCountdown(endTime);
  });

  ipcMain.on('stop-countdown', () => {
    console.log('[Main Process] Stopping countdown');
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
