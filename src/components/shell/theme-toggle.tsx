"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Theme = "system" | "dark";

const options: { value: Theme | "light"; label: string; icon: typeof Laptop; disabled?: boolean }[] = [
  { value: "system", label: "System theme", icon: Laptop },
  { value: "light", label: "Light theme", icon: Sun, disabled: true },
  { value: "dark", label: "Dark theme", icon: Moon },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const index = options.findIndex((o) => o.value === theme);

  return (
    <div role="tablist" aria-label="Theme" className="relative flex h-8 w-full items-center rounded-full border-2 border-border-tertiary bg-surface-main-background p-0.5">
      <span
        aria-hidden="true"
        className="absolute h-6 rounded-full bg-surface-hover shadow-[0_1px_3px_rgb(0_0_0/10%),0_1px_2px_-1px_rgb(0_0_0/10%)] transition-transform duration-200 ease-in-out"
        style={{ width: "calc((100% - 4px) / 3)", transform: `translateX(${index * 100}%)` }}
      />
      {options.map(({ value, label, icon: Icon, disabled }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-label={label}
          aria-selected={theme === value}
          aria-disabled={disabled || undefined}
          title={disabled ? NOT_AVAILABLE_TOOLTIP : undefined}
          onClick={disabled ? undefined : () => setTheme(value as Theme)}
          className={cn(
            "z-10 flex h-6 flex-1 items-center justify-center rounded-full transition-colors",
            "text-text-secondary hover:text-text-primary",
            !disabled && theme === value && "text-text-primary",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
