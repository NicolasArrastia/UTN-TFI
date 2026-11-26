import { createContext } from "react";

export type ThemeName = "indigo" | "emerald" | "gray";

export interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const THEME_STORAGE_KEY = "utn-tfi-theme";

export const THEME_NAMES: readonly ThemeName[] = [
  "indigo",
  "emerald",
  "gray",
];

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" &&
  (THEME_NAMES as readonly string[]).includes(value);

export const ThemeContext = createContext<ThemeContextValue | null>(null);
