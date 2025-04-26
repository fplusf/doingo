import { useStore } from '@tanstack/react-store';
import { useEffect } from 'react';
import { tasksStore } from '../stores/tasks.store';
import { OptimalTask } from '../types/task.types';

// Define the interface for the exposed Electron API
interface ElectronApi {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}

const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
const ipcRenderer = isElectron ? window.electron?.ipcRenderer : null;

export const useMenuBarCountdown = () => {
  console.log('[MenuBarCountdown] Hook running.');

  if (!isElectron) {
    console.log('[MenuBarCountdown] Not running in Electron environment');
    return {
      startCountdown: () => {},
      stopCountdown: () => {},
      isRunning: false,
    };
  }

  if (!ipcRenderer) {
    console.warn('[MenuBarCountdown] ipcRenderer is not available on window.electron');
    return {
      startCountdown: () => {},
      stopCountdown: () => {},
      isRunning: false,
    };
  }

  const { focusedTaskId, tasks } = useStore(tasksStore, (state) => {
    console.log('[MenuBarCountdown] Reading from tasksStore. Focused ID:', state.focusedTaskId);
    return {
      focusedTaskId: state.focusedTaskId,
      tasks: state.tasks,
    };
  });

  const focusedTask = tasks.find((task: OptimalTask) => task.id === focusedTaskId);

  useEffect(() => {
    if (focusedTask) {
      console.log('[MenuBarCountdown] Found focused task:', {
        id: focusedTask.id,
        startTime: focusedTask.startTime,
        duration: focusedTask.duration,
      });
    } else {
      console.log('[MenuBarCountdown] No focused task found.');
    }
  }, [focusedTask]);

  useEffect(() => {
    console.log('[MenuBarCountdown] Effect triggered. Focused Task ID:', focusedTaskId);

    if (focusedTask && focusedTask.startTime && focusedTask.duration) {
      try {
        const startTime = new Date(focusedTask.startTime).getTime();
        const endTime = startTime + focusedTask.duration;
        const now = Date.now();
        console.log(
          `[MenuBarCountdown] Task times: Start=${startTime}, End=${endTime}, Now=${now}`,
        );

        if (now < endTime) {
          console.log(
            `[MenuBarCountdown] Starting countdown to: ${new Date(endTime).toISOString()}`,
          );
          ipcRenderer.send('start-countdown', endTime);
        } else {
          console.log('[MenuBarCountdown] Task already ended or duration invalid.');
          ipcRenderer.send('stop-countdown');
        }
      } catch (error) {
        console.error('[MenuBarCountdown] Error setting up countdown:', error);
        ipcRenderer.send('stop-countdown');
      }
    } else {
      console.log('[MenuBarCountdown] No focused task or missing start/duration.');
      ipcRenderer.send('stop-countdown');
    }

    // Cleanup function
    return () => {
      ipcRenderer.send('stop-countdown');
    };
  }, [focusedTaskId, focusedTask]);

  return {
    startCountdown: (endTime: number) => ipcRenderer.send('start-countdown', endTime),
    stopCountdown: () => ipcRenderer.send('stop-countdown'),
    isRunning: focusedTask?.startTime !== undefined,
  };
};
