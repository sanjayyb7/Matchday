"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const options: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-heading text-lg font-bold uppercase tracking-wide">
        Appearance
      </h2>
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-card p-1">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              theme === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Dark mode is the default matchday look. Light mode coming soon to all screens.
      </p>
    </section>
  );
}
