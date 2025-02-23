import { ThemeMode } from '@/lib/types/theme-mode';

const THEME_KEY = 'theme';

export interface ThemePreferences {
  system: ThemeMode;
  local: ThemeMode | null;
}

function isElectron(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer'
  );
}

export async function getCurrentTheme(): Promise<ThemePreferences> {
  const currentTheme =
    isElectron() && window.themeMode ? await window.themeMode.current() : 'light';
  const localTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;

  return {
    system: currentTheme,
    local: localTheme,
  };
}

export async function setTheme(newTheme: ThemeMode) {
  if (isElectron() && window.themeMode) {
    switch (newTheme) {
      case 'dark':
        await window.themeMode.dark();
        updateDocumentTheme(true);
        break;
      case 'light':
        await window.themeMode.light();
        updateDocumentTheme(false);
        break;
      case 'system':
        const isDarkMode = await window.themeMode.system();
        updateDocumentTheme(isDarkMode);
        break;
    }
  } else {
    updateDocumentTheme(newTheme === 'dark');
  }

  localStorage.setItem(THEME_KEY, newTheme);
}

export async function toggleTheme() {
  if (isElectron() && window.themeMode) {
    const isDarkMode = await window.themeMode.toggle();
    const newTheme = isDarkMode ? 'dark' : 'light';
    updateDocumentTheme(isDarkMode);
    localStorage.setItem(THEME_KEY, newTheme);
  } else {
    const currentTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    updateDocumentTheme(newTheme === 'dark');
    localStorage.setItem(THEME_KEY, newTheme);
  }
}

export async function syncThemeWithLocal() {
  const { local } = await getCurrentTheme();
  if (!local) {
    setTheme('system');
    return;
  }

  await setTheme(local);
}

/**
 * Helps to update the theme when running in the browser
 */
function updateDocumentTheme(isDarkMode: boolean) {
  if (!isDarkMode) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}
