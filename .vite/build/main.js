"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const child_process = require("child_process");
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
const openBrowser = async (url) => {
  const open = (await import("open")).default;
  await open(url);
};
function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: false,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: {
      x: 16,
      y: 16
    }
  });
  registerListeners(mainWindow);
  const appUrl = "http://localhost:5173";
  mainWindow.loadURL(appUrl);
  {
    mainWindow.webContents.openDevTools();
    console.log("Opening DevTools");
    openBrowser("http://localhost:5173");
  }
  if (inDevelopment) {
    child_process.exec("npm run dev", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting Vite dev server: ${error.message}`);
        return;
      }
      console.log(`Vite dev server started: ${stdout}`);
      openBrowser("http://localhost:3000");
    });
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
