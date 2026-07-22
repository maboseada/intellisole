"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        theme === "dark" ? "bg-blue-600" : "bg-slate-200",
        className
      )}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={cn(
          "inline-block h-7 w-7 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-md",
          theme === "dark" ? "translate-x-8" : "translate-x-1"
        )}
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4 text-blue-600" />
        ) : (
          <Sun className="h-4 w-4 text-orange-500" />
        )}
      </span>
    </button>
  );
}
