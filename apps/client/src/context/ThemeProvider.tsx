import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  isThemeName,
} from "./theme-context.ts";
import type { ThemeName } from "./theme-context.ts";

const DEFAULT_THEME: ThemeName = "indigo";

interface ThemeProviderProps {
  children: ReactNode;
}

const readStoredTheme = (): ThemeName => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const applyTheme = (theme: ThemeName): void => {
  document.documentElement.dataset.theme = theme;

  const favicon = document.getElementById("app-favicon");

  if (favicon instanceof HTMLLinkElement) {
    favicon.href = `/favicon-${theme}.svg`;
  }
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignoramos fallas de almacenamiento (modo privado, cuota, etc.).
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
