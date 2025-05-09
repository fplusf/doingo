import { WIN_CLOSE_CHANNEL, WIN_MAXIMIZE_CHANNEL, WIN_MINIMIZE_CHANNEL } from './window-channels';

const isElectron = typeof window !== 'undefined' && window.require;

export function exposeWindowContext() {
  const { contextBridge, ipcRenderer } = isElectron
    ? window.require('electron')
    : global.require('electron');
  contextBridge.exposeInMainWorld('electronWindow', {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),
  });
}
