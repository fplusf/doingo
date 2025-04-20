import { contextBridge, ipcRenderer } from 'electron';
import { exposeThemeContext } from './theme/theme-context';
import { exposeWindowContext } from './window/window-context';

// Function to expose ipcRenderer safely
const exposeIpcRenderer = () => {
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => {
        // List channels allowed to send from renderer to main
        const validChannels = ['update-timer', 'start-countdown', 'stop-countdown'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, ...args);
        }
      },
      // You can expose 'on' and 'removeListener' here too if needed for bidirectional communication
      // on: (channel: string, func: (...args: any[]) => void) => {
      //   const validChannels = ['some-reply-channel'];
      //   if (validChannels.includes(channel)) {
      //     // Deliberately strip event as it includes `sender`
      //     ipcRenderer.on(channel, (event, ...args) => func(...args));
      //   }
      // },
      // removeListener: (channel: string, func: (...args: any[]) => void) => {
      //   ipcRenderer.removeListener(channel, func);
      // },
    },
  });
};

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeIpcRenderer();
}
