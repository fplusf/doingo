import { contextBridge, ipcRenderer } from 'electron';
import { exposeThemeContext } from './theme/theme-context';
import { exposeWindowContext } from './window/window-context';

// Function to expose ipcRenderer safely
const exposeIpcRenderer = () => {
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => {
        // List channels allowed to send from renderer to main
        const validChannels = [
          'update-timer',
          'start-countdown',
          'stop-countdown',
          'show-notification',
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, ...args);
        }
      },
      on: (channel: string, func: (...args: any[]) => void) => {
        // List channels allowed to receive from main to renderer
        const validChannels = ['pomodoro-timer-tick', 'pomodoro-timer-completed'];
        if (validChannels.includes(channel)) {
          // Pass the first argument after event, which contains our data
          ipcRenderer.on(channel, (event, data) => func(data));
        }
      },
      once: (channel: string, func: (...args: any[]) => void) => {
        // List channels allowed to receive once from main to renderer
        const validChannels = ['pomodoro-timer-completed'];
        if (validChannels.includes(channel)) {
          ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
      },
      invoke: (channel: string, ...args: any[]) => {
        // List channels allowed for invoke from renderer to main
        const validChannels = [
          'start-pomodoro-timer',
          'pause-pomodoro-timer',
          'reset-pomodoro-timer',
          'switch-pomodoro-mode',
          'set-pomodoro-duration',
          'set-break-duration',
          'get-pomodoro-state',
        ];
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args);
        }
        return Promise.reject(new Error(`Unauthorized invoke to channel: ${channel}`));
      },
    },
  });
};

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeIpcRenderer();
}
