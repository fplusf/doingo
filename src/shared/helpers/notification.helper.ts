import { toast } from 'sonner';
import { ElectronApi } from '../types/electron';

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}

const isElectron = !!window.electron;

/**
 * Shows a notification to the user.
 * It uses system notifications in Electron and toast notifications in the browser.
 * @param title - The title of the notification.
 * @param body - The body/description of the notification.
 */
export const showTaskCompletionNotification = (title: string, body: string) => {
  if (isElectron && window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.send('show-notification', { title, body });
  } else {
    toast.success(title, {
      description: body,
      position: 'top-right',
    });
  }
};
