import { RouterProvider } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { TaskHistoryProvider } from './features/tasks/providers/task-history-provider';
import { initializeGlobalTimer } from './features/tasks/services/global-pomodoro-timer.service';
import {
  startTaskCompletionMonitor,
  stopTaskCompletionMonitor,
} from './features/tasks/services/task-completion.monitor';
import './localization/i18n';
import { router } from './routes/router';
import { updateAppLanguage } from './shared/helpers/language_helpers';
import { syncThemeWithLocal } from './shared/helpers/theme_helpers';

export default function App() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();

  initializeGlobalTimer();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);
    startTaskCompletionMonitor();

    return () => {
      stopTaskCompletionMonitor();
    };
  }, [i18n]);

  return (
    <TaskHistoryProvider>
      <Toaster />
      <RouterProvider router={router} defaultPreload="intent" />
    </TaskHistoryProvider>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
