"use strict";
const electron = require("electron");
const path = require("path");
const THEME_MODE_CURRENT_CHANNEL = "theme-mode:current";
const THEME_MODE_TOGGLE_CHANNEL = "theme-mode:toggle";
const THEME_MODE_DARK_CHANNEL = "theme-mode:dark";
const THEME_MODE_LIGHT_CHANNEL = "theme-mode:light";
const THEME_MODE_SYSTEM_CHANNEL = "theme-mode:system";
function addThemeEventListeners() {
  electron.ipcMain.handle(THEME_MODE_CURRENT_CHANNEL, () => electron.nativeTheme.themeSource);
  electron.ipcMain.handle(THEME_MODE_TOGGLE_CHANNEL, () => {
    if (electron.nativeTheme.shouldUseDarkColors) {
      electron.nativeTheme.themeSource = "light";
    } else {
      electron.nativeTheme.themeSource = "dark";
    }
    return electron.nativeTheme.shouldUseDarkColors;
  });
  electron.ipcMain.handle(THEME_MODE_DARK_CHANNEL, () => electron.nativeTheme.themeSource = "dark");
  electron.ipcMain.handle(THEME_MODE_LIGHT_CHANNEL, () => electron.nativeTheme.themeSource = "light");
  electron.ipcMain.handle(THEME_MODE_SYSTEM_CHANNEL, () => {
    electron.nativeTheme.themeSource = "system";
    return electron.nativeTheme.shouldUseDarkColors;
  });
}
const WIN_MINIMIZE_CHANNEL = "window:minimize";
const WIN_MAXIMIZE_CHANNEL = "window:maximize";
const WIN_CLOSE_CHANNEL = "window:close";
function addWindowEventListeners(mainWindow) {
  electron.ipcMain.handle(WIN_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });
  electron.ipcMain.handle(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  electron.ipcMain.handle(WIN_CLOSE_CHANNEL, () => {
    mainWindow.close();
  });
}
function registerListeners(mainWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
}
const inDevelopment = process.env.NODE_ENV === "development";
function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload
    },
    titleBarStyle: "hidden"
  });
  registerListeners(mainWindow);
  {
    mainWindow.loadURL("http://localhost:5173");
  }
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
