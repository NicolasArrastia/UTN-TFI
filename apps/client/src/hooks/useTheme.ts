import { useContext } from "react";
import { ThemeContext } from "../context/theme-context.ts";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe utilizarse dentro de un ThemeProvider.");
  }

  return context;
}
