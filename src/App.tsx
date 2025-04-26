import { RouterProvider } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { useMenuBarCountdown } from './features/tasks/hooks/use-menu-bar-countdown';
import { TaskHistoryProvider } from './features/tasks/providers/task-history-provider';
import './localization/i18n';
import { router } from './routes/router';
import { updateAppLanguage } from './shared/helpers/language_helpers';
import { syncThemeWithLocal } from './shared/helpers/theme_helpers';

export default function App() {
  const { i18n } = useTranslation();

  // run the countdown while the app is running
  useMenuBarCountdown();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <TaskHistoryProvider>
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
