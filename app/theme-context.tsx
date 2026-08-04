"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const THEMES = ["mist", "earth", "mono", "dusk", "night"] as const;
type Theme = (typeof THEMES)[number];

const ThemeContext = createContext<{
  theme: Theme;
  cycleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("mist");
  const cycleTheme = () =>
    setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export type { Theme };
