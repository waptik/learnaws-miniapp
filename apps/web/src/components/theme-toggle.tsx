"use client";

import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="celo-button celo-sharp"
      aria-label={`Current theme: ${theme}. Click to switch to ${
        theme === "light" ? "dark" : "light"
      }`}
      type="button"
    >
      <span className="flex items-center gap-2">
        {theme === "light" ? (
          <>
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span className="hidden sm:inline">Dark</span>
          </>
        )}
      </span>
    </button>
  );
}
