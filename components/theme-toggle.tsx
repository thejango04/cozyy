"use client";

import * as React from "react";
import { SunIcon, MoonIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_KEY = "cozyy-theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  React.useLayoutEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) return <div className="w-[68px] h-8" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative flex items-center w-[68px] h-8 rounded-full p-1 transition-colors duration-300",
        isDark
          ? "bg-[#2a2520] border border-[#3a3530]"
          : "bg-cozy-border border border-cozy-border"
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Sun icon (left) */}
      <SunIcon
        className={cn(
          "h-4 w-4 z-10 transition-colors duration-300 ml-1",
          isDark ? "text-[#6B6560]" : "text-amber-600"
        )}
      />
      {/* Moon icon (right) */}
      <MoonIcon
        className={cn(
          "h-4 w-4 z-10 transition-colors duration-300 ml-auto mr-1",
          isDark ? "text-indigo-300" : "text-[#A39E98]"
        )}
      />
      {/* Sliding knob */}
      <span
        className={cn(
          "absolute top-1 h-6 w-6 rounded-full shadow-md transition-all duration-300",
          isDark
            ? "left-[38px] bg-[#3a3530]"
            : "left-1 bg-white"
        )}
      />
    </button>
  );
}
