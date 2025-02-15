import { exec } from 'child_process';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import registerListeners from './helpers/ipc/listeners-register';

const inDevelopment = process.env.NODE_ENV === 'development';

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

app.whenReady().then(createWindow);

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
